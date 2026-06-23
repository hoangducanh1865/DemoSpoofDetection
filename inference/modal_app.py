"""
Modal GPU Inference Service — Dual Model: MoLEx + AASIST
Deploy: modal deploy inference/modal_app.py
Test:   modal run   inference/modal_app.py
"""
import modal
import torch
import torchaudio
import subprocess
import tempfile
import base64
import os
import sys
import time
from pathlib import Path

# ── Constants ────────────────────────────────────────────────────
VOLUME_NAME     = "spoof-detection-models"
APP_NAME        = "spoof-detection"
MOLEX_CKPT      = "/vol/models/molex/averaged_checkpoint.pth"
AASIST_CKPT     = "/vol/models/aasist/aasist_asvspoof5.pth"
WAVLM_CKPT      = "/vol/models/wavlm/pytorch_model.bin"
SAMPLE_RATE     = 16000
SEGMENT_SAMPLES = 64600
SAMPLE_RATIOS   = [0.10, 0.50, 0.90]

MOLEX_CONFIG = {
    "SSL_dim": 1024, "SSL_layer_num": 12,
    "num_expert": 12, "num_MOE_layer": 12,
    "expert_rank": 32, "topk": 4,
    "Finetune_id": "False", "nb_samp": 64600,
    "wavlm_checkpoint": WAVLM_CKPT,
}

AASIST_CONFIG = {
    "architecture": "AASIST", "nb_samp": 64600, "first_conv": 128,
    "filts": [70, [1, 32], [32, 32], [32, 64], [64, 64]],
    "gat_dims": [64, 32],
    "pool_ratios": [0.5, 0.7, 0.5, 0.5],
    "temperatures": [2.0, 2.0, 100.0, 100.0],
}

# ── Modal App ─────────────────────────────────────────────────────
_SCRIPT_DIR = Path(__file__).resolve().parent

app    = modal.App(APP_NAME)
volume = modal.Volume.from_name(VOLUME_NAME, create_if_missing=True)

# Image: GPU-enabled torch + audio deps
inference_image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(["ffmpeg", "libsndfile1"])
    .pip_install([
        "torch==2.1.0",
        "torchaudio==2.1.0",
        "yt-dlp>=2024.1.0",
        "numpy>=1.24.0,<2",
        "scipy>=1.10.0",
        "fastapi>=0.104.0",
        "pydantic>=2.0.0",
    ])
    .add_local_dir(str(_SCRIPT_DIR / "model"), remote_path="/root/model")
)


# ── Dual Model Container ──────────────────────────────────────────
@app.cls(
    gpu="T4",
    image=inference_image,
    volumes={"/vol": volume},
    timeout=600,
    scaledown_window=120,
)
class DualSpoofDetector:

    @modal.enter()
    def load_models(self):
        """
        Load both models when the container starts.
        Runs once for the lifetime of the container — then reuses.
        """
        sys.path.insert(0, "/root")  # so model/ package is importable
        self.device = torch.device("cuda")

        # ── Load MoLEx ──────────────────────────────────────────────
        from model.molex_arch import Model_MoLEx
        self.molex = Model_MoLEx(MOLEX_CONFIG)
        ckpt = torch.load(MOLEX_CKPT, map_location="cpu")
        # MoLEx checkpoint has "module." prefix from DDP training — strip it
        ckpt = {k.replace("module.", ""): v for k, v in ckpt.items()}
        self.molex.load_state_dict(ckpt, strict=False)
        self.molex = self.molex.to(self.device).eval()
        molex_params = sum(p.numel() for p in self.molex.parameters())
        print(f"MoLEx loaded: {molex_params:,} params")

        # ── Load AASIST ─────────────────────────────────────────────
        from model.aasist_arch import Model as AASISTModel
        self.aasist = AASISTModel(AASIST_CONFIG)
        self.aasist.load_state_dict(
            torch.load(AASIST_CKPT, map_location="cpu"), strict=True
        )
        self.aasist = self.aasist.to(self.device).eval()
        aasist_params = sum(p.numel() for p in self.aasist.parameters())
        print(f"AASIST loaded: {aasist_params:,} params")

        print("Both models loaded on GPU.")

    # ── Audio utilities ──────────────────────────────────────────

    def _load_and_preprocess(self, wav_path: str) -> torch.Tensor:
        """WAV file -> 16kHz mono tensor on CUDA."""
        waveform, sr = torchaudio.load(wav_path)
        if sr != SAMPLE_RATE:
            waveform = torchaudio.transforms.Resample(sr, SAMPLE_RATE)(waveform)
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)
        return waveform.to(self.device)  # [1, T]

    def _extract_segment(self, waveform: torch.Tensor, ratio: float) -> torch.Tensor:
        """Extract a SEGMENT_SAMPLES chunk at position ratio (0..1) in waveform."""
        T = waveform.shape[1]
        center = int(T * ratio)
        start  = max(0, center - SEGMENT_SAMPLES // 2)
        end    = start + SEGMENT_SAMPLES
        if end > T:
            start = max(0, T - SEGMENT_SAMPLES)
            end   = T
        seg = waveform[:, start:end]
        if seg.shape[1] < SEGMENT_SAMPLES:
            seg = torch.nn.functional.pad(seg, (0, SEGMENT_SAMPLES - seg.shape[1]))
        return seg  # [1, SEGMENT_SAMPLES]

    # ── Single model inference ────────────────────────────────────

    def _run_molex(self, segment: torch.Tensor) -> dict:
        """
        Run MoLEx on a single segment.
        Output: {label: 'real'|'spoof', spoof_prob: float}
        Index 0 = spoof, Index 1 = bonafide
        """
        with torch.no_grad():
            out = self.molex(segment)  # [1, 2] logits
            probs = torch.softmax(out, dim=-1)
            # Index 0 = spoof, Index 1 = bonafide
            spoof_prob = probs[0, 0].item()
        return {
            "label": "spoof" if spoof_prob > 0.5 else "real",
            "spoof_prob": round(spoof_prob, 4),
        }

    def _run_aasist(self, segment: torch.Tensor) -> dict:
        """
        Run AASIST on a single segment.
        AASIST forward returns tuple: (last_hidden, output[1,2])
        Index 0 = spoof, Index 1 = bonafide
        """
        with torch.no_grad():
            _, out = self.aasist(segment)  # returns (last_hidden, output[1,2])
            probs = torch.softmax(out, dim=-1)
            spoof_prob = probs[0, 0].item()
        return {
            "label": "spoof" if spoof_prob > 0.5 else "real",
            "spoof_prob": round(spoof_prob, 4),
        }

    # ── Multi-segment pipeline ────────────────────────────────────

    def _analyze_waveform(
        self, waveform: torch.Tensor, run_molex: bool, run_aasist: bool
    ) -> dict:
        """Extract segments, run model(s), return combined results."""
        total_secs = waveform.shape[1] / SAMPLE_RATE
        ratios = SAMPLE_RATIOS if total_secs > 10 else [0.50]

        result = {}

        for model_name, should_run, run_fn in [
            ("molex",  run_molex,  self._run_molex),
            ("aasist", run_aasist, self._run_aasist),
        ]:
            if not should_run:
                continue

            model_start = time.time()
            segments_out = []
            spoof_probs  = []

            for ratio in ratios:
                seg = self._extract_segment(waveform, ratio)
                out = run_fn(seg)
                spoof_probs.append(out["spoof_prob"])
                segments_out.append({
                    "pct":        int(ratio * 100),
                    "label":      out["label"],
                    "confidence": round(
                        out["spoof_prob"] if out["label"] == "spoof"
                        else 1 - out["spoof_prob"], 4
                    ),
                })

            model_ms = int((time.time() - model_start) * 1000)

            avg_spoof = sum(spoof_probs) / len(spoof_probs)
            final_label = "spoof" if avg_spoof > 0.5 else "real"
            result[model_name] = {
                "label":             final_label,
                "confidence":        round(
                    avg_spoof if final_label == "spoof" else 1 - avg_spoof, 4
                ),
                "spoof_probability": round(avg_spoof, 4),
                "segments":          segments_out,
                "total_duration_sec": round(total_secs, 1),
                "processing_ms":     model_ms,
            }

        return result

    # ── Core logic (plain methods, callable from anywhere) ──────

    def _do_infer_youtube(self, youtube_url, run_molex, run_aasist):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_tpl = os.path.join(tmpdir, "audio.%(ext)s")
            proc = subprocess.run(
                [
                    "yt-dlp", "-x", "--audio-format", "wav",
                    "--audio-quality", "0", "--no-playlist",
                    "-o", out_tpl, youtube_url,
                ],
                capture_output=True, text=True, timeout=120,
            )

            if proc.returncode != 0:
                raise RuntimeError(f"yt-dlp error: {proc.stderr[:500]}")

            wav_files = list(Path(tmpdir).glob("*.wav"))
            if wav_files:
                wav_path = str(wav_files[0])
            else:
                src = next(Path(tmpdir).iterdir())
                wav_path = os.path.join(tmpdir, "converted.wav")
                subprocess.run(
                    [
                        "ffmpeg", "-i", str(src),
                        "-ar", str(SAMPLE_RATE), "-ac", "1", wav_path,
                    ],
                    check=True, capture_output=True,
                )

            waveform = self._load_and_preprocess(wav_path)
            return self._analyze_waveform(waveform, run_molex, run_aasist)

    def _do_infer_file(self, audio_b64, filename, run_molex, run_aasist):
        audio_bytes = base64.b64decode(audio_b64)
        with tempfile.TemporaryDirectory() as tmpdir:
            src = os.path.join(tmpdir, filename)
            with open(src, "wb") as f:
                f.write(audio_bytes)

            wav_path = os.path.join(tmpdir, "audio.wav")
            subprocess.run(
                [
                    "ffmpeg", "-i", src,
                    "-ar", str(SAMPLE_RATE), "-ac", "1", wav_path,
                ],
                check=True, capture_output=True,
            )

            waveform = self._load_and_preprocess(wav_path)
            return self._analyze_waveform(waveform, run_molex, run_aasist)

    # ── Modal remote methods (for local_entrypoint / external calls)

    @modal.method()
    def infer_youtube(self, youtube_url, run_molex=True, run_aasist=True):
        return self._do_infer_youtube(youtube_url, run_molex, run_aasist)

    @modal.method()
    def infer_file(self, audio_b64, filename, run_molex=True, run_aasist=True):
        return self._do_infer_file(audio_b64, filename, run_molex, run_aasist)

    # ── HTTP Web Endpoint (runs directly on GPU container) ───────
    @modal.fastapi_endpoint(method="POST", label="infer")
    def infer(self, payload: dict) -> dict:
        models_req = payload.get("models", ["molex", "aasist"])
        run_molex  = "molex"  in models_req
        run_aasist = "aasist" in models_req

        if not run_molex and not run_aasist:
            return {"error": "Must select at least 1 model"}

        if "youtube_url" in payload:
            return self._do_infer_youtube(
                payload["youtube_url"], run_molex, run_aasist
            )
        elif "audio_b64" in payload:
            return self._do_infer_file(
                payload["audio_b64"],
                payload.get("filename", "audio.wav"),
                run_molex, run_aasist,
            )
        else:
            return {"error": "Missing youtube_url or audio_b64"}


# ── Local test ────────────────────────────────────────────────────
@app.local_entrypoint()
def test():
    """modal run inference/modal_app.py"""
    d = DualSpoofDetector()
    test_wav = "/tmp/test_spoof.wav"
    if os.path.exists(test_wav):
        b64 = base64.b64encode(open(test_wav, "rb").read()).decode()
        r = d.infer_file.remote(b64, "test_spoof.wav", run_molex=True, run_aasist=True)
        import json
        print(json.dumps(r, indent=2))
    else:
        print(
            "Create a test file first:\n"
            "  ffmpeg -f lavfi -i 'sine=frequency=440:duration=4' "
            "-ar 16000 /tmp/test_spoof.wav"
        )
