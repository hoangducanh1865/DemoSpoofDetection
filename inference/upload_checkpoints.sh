#!/bin/bash
set -e
VOLUME="spoof-detection-models"
BASE="/Volumes/MTS800/it/vdt/spoof/project_phase_1/large_files"

echo "Step 1/3: Upload AASIST (1.3 MB)"
modal volume put "$VOLUME" \
  "$BASE/pretrained_spoof_models/trained_on_asvspoof5/aasist/aasist_asvspoof5.pth" \
  "models/aasist/aasist_asvspoof5.pth"

echo "Step 2/3: Upload WavLM-Large (1.2 GB)"
START=$(date +%s)
modal volume put "$VOLUME" \
  "$BASE/pretrained_ssl_models/wavlm_large__mrdragonfox__llase_g1/pytorch_model.bin" \
  "models/wavlm/pytorch_model.bin"
END=$(date +%s)
echo "WavLM done in $((END-START))s"

echo "Step 3/3: Upload MoLEx (1.4 GB)"
START=$(date +%s)
modal volume put "$VOLUME" \
  "$BASE/pretrained_spoof_models/trained_on_asvspoof5/molex/2026_06_17_13_46_58/weights/averaged_checkpoint.pth" \
  "models/molex/averaged_checkpoint.pth"
END=$(date +%s)
echo "MoLEx done in $((END-START))s"

echo "Verify: modal volume ls $VOLUME"
