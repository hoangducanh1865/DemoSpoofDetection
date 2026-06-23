"""
Local test script for the Modal spoof detection endpoint.

Usage:
    python inference/test_local.py

This script generates a synthetic sine-wave WAV file, base64-encodes it,
and calls the Modal endpoint (if deployed) to verify inference works.
"""

import base64
import io
import json
import struct
import math


def generate_sine_wav(frequency=440.0, duration_sec=4.0, sample_rate=16000):
    """Generate a raw WAV file bytes for a sine wave."""
    num_samples = int(sample_rate * duration_sec)
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = num_samples * block_align

    buf = io.BytesIO()
    # RIFF header
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + data_size))
    buf.write(b"WAVE")
    # fmt chunk
    buf.write(b"fmt ")
    buf.write(struct.pack("<I", 16))  # chunk size
    buf.write(struct.pack("<H", 1))   # PCM
    buf.write(struct.pack("<H", num_channels))
    buf.write(struct.pack("<I", sample_rate))
    buf.write(struct.pack("<I", byte_rate))
    buf.write(struct.pack("<H", block_align))
    buf.write(struct.pack("<H", bits_per_sample))
    # data chunk
    buf.write(b"data")
    buf.write(struct.pack("<I", data_size))

    amplitude = 16000
    for i in range(num_samples):
        t = i / sample_rate
        sample = int(amplitude * math.sin(2 * math.pi * frequency * t))
        sample = max(-32768, min(32767, sample))
        buf.write(struct.pack("<h", sample))

    return buf.getvalue()


def main():
    print("Generating 4-second 440Hz sine wave at 16kHz...")
    wav_bytes = generate_sine_wav(frequency=440.0, duration_sec=4.0, sample_rate=16000)
    audio_b64 = base64.b64encode(wav_bytes).decode("ascii")

    print(f"WAV size: {len(wav_bytes):,} bytes")
    print(f"Base64 size: {len(audio_b64):,} chars")

    payload = {
        "audio_b64": audio_b64,
        "filename": "test_sine.wav",
        "models": ["molex", "aasist"],
    }

    print("\nPayload ready. To test against a deployed Modal endpoint:")
    print("  1. Deploy: modal deploy inference/modal_app.py")
    print("  2. Get the endpoint URL from Modal dashboard")
    print("  3. Use curl or httpx to POST the payload:\n")

    # Print a curl command for easy testing
    print("curl -X POST <MODAL_ENDPOINT_URL> \\")
    print("  -H 'Content-Type: application/json' \\")
    print(f"  -d '{json.dumps({\"audio_b64\": audio_b64[:50] + \"...\", \"filename\": \"test_sine.wav\", \"models\": [\"molex\", \"aasist\"]})}'")

    print("\n--- Or test via Modal CLI ---")
    print("modal run inference/modal_app.py")
    print("(This uses the local_entrypoint defined in modal_app.py)")

    # Try to call remotely if modal is installed
    try:
        import modal
        print("\nModal SDK detected. Attempting remote call...")
        # This would work if the app is deployed
        # Uncomment the lines below after deployment:
        # detector = modal.Cls.lookup("spoof-detection", "DualSpoofDetector")()
        # result = detector.infer_file.remote(audio_b64, "test_sine.wav", True, True)
        # print(json.dumps(result, indent=2))
        print("(Remote call commented out — uncomment after deployment)")
    except ImportError:
        print("\nModal SDK not installed. Install with: pip install modal")


if __name__ == "__main__":
    main()
