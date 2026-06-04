# AED Subtitles

Auto-subtitles pipeline for After Effects:
- extract audio from video/comp source
- transcribe speech locally with faster-whisper (`turbo` by default)
- postprocess into readable subtitle blocks
- review/edit captions before applying
- apply reference-text corrections and changed-only caption patches
- create/update AE subtitle text layers with presets, safe-zone positioning, and native QA checks
- CEP panel scans active timeline audio and selects all file-backed audio layers by default

## Project structure
```text
ae-auto-subtitles/
  panel/
  scripts/
    create_subtitles.jsx
    utils.jsxinc
  backend/
    transcribe.py
    postprocess.py
    io_json.py
    requirements.txt
  config/
    presets.json
  samples/
    sample.mp4
    sample.subtitles.json
  install.md
  README.md
```

## Commands

### `extract_audio`
```bash
source .venv/bin/activate
python backend/transcribe.py --extract --input samples/sample.mp4 --wav_out tmp/sample.wav
```

### `transcribe` (raw + subtitles by default)
```bash
source .venv/bin/activate
python backend/transcribe.py --input samples/sample.mp4 --out tmp/raw.json --subtitles_out tmp/subtitles.json --lang auto --model turbo
```

### `postprocess_subtitles`
```bash
source .venv/bin/activate
python backend/postprocess.py --input tmp/raw.json --out tmp/subtitles.json --max_chars 42 --max_lines 2 --min_dur 0.35 --max_dur 4.5
```

### `create_subtitles_in_ae`
- In AE settings enable: `Preferences -> Scripting & Expressions -> Allow Scripts to Write Files and Access Network`
- Run in AE: `File -> Scripts -> Run Script File...`
- Select `/Users/airliner/ae-auto-subtitles/scripts/create_subtitles.jsx`

Generated layers:
- subtitle text: `SUB__{id}`
- box background (box preset): `BOX__{id}`
- container null: `SUBTITLES__AUTO`

### `full_run`
```bash
source .venv/bin/activate
python backend/transcribe.py --full_run --input samples/sample.mp4 --out tmp/raw.json --subtitles_out tmp/subtitles.json --lang auto --model turbo --max_chars 42 --max_lines 2 --min_dur 0.35 --max_dur 4.5
```

### `full_run` from timeline source list (`sources_json`)
```bash
source .venv/bin/activate
python backend/transcribe.py --full_run --sources_json '[{"path":"samples/sample.mp4","layerName":"video","inPoint":0,"outPoint":20,"startTime":0}]' --out tmp/raw.json --subtitles_out tmp/subtitles.json --model turbo
```

## Presets
`config/presets.json` includes:
- `classic_clean`
- `bold_yellow_shadow`
- `reels_bold_yellow`
- `bold_two_words`

Defaults:
- language: `auto`
- model: `turbo`
- preset: `bold_yellow_shadow`
- marginY: `224`
- max_chars_per_line: `42`
- max_lines: `2`

## Idempotency
Run/Create rebuilds managed subtitle layers for the active comp. `Apply Changed` uses a partial AE mode that only updates reference-changed caption ids and leaves unchanged subtitle layers untouched.

## Logging
Runtime logs are written to:
- `~/Documents/ae_subtitles_logs/ae_auto_subtitles.log`

## Notes
- Release target is macOS.
- 24/25/29.97 fps are supported via second-based in/out timing in AE.
- CEP UI is the primary workflow surface over backend transcription, review, style preview, and JSX apply.
- In panel mode, `Scan` reads enabled audio layers from active comp and selects all file-backed audio layers by default, which avoids missing speech in montage-style timelines.
- `Native QA` runs syntax checks, unit smoke tests, and real AE layout/timing self-tests.
