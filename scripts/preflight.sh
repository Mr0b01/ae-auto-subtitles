#!/bin/sh
set -eu

python scripts/check_public_hygiene.py
node --check panel/main.js
python -m py_compile \
  backend/transcribe.py \
  backend/postprocess.py \
  backend/io_json.py \
  scripts/native_qa.py \
  scripts/verify_ae_layout.py \
  scripts/verify_ae_timing.py \
  scripts/check_public_hygiene.py
python -m unittest discover -s tests
