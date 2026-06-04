# Installation (macOS)

## 1) Prerequisites
- Adobe After Effects (tested workflow: AE with ExtendScript support)
- Python 3.10+ (`python3`)
- `ffmpeg`

Install `ffmpeg` on macOS:
```bash
brew install ffmpeg
```

## 2) Backend setup
```bash
cd /Users/airliner/ae-auto-subtitles
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

## 3) Quick backend verification
```bash
source .venv/bin/activate
python backend/transcribe.py --extract --input samples/sample.mp4 --wav_out tmp/sample.wav
python backend/transcribe.py --full_run --input samples/sample.mp4 --out tmp/raw.json --subtitles_out tmp/subtitles.json --model turbo
```

Expected outputs:
- `tmp/sample.wav`
- `tmp/raw.json`
- `tmp/subtitles.json`
- logs in `~/Documents/ae_subtitles_logs/ae_auto_subtitles.log`

## 4) Use in After Effects (script-only path)
1. Open your comp in AE.
2. Ensure AE setting is enabled: `Preferences -> Scripting & Expressions -> Allow Scripts to Write Files and Access Network`.
3. Generate subtitles JSON via backend (`--full_run` above).
4. In AE: `File -> Scripts -> Run Script File...`
5. Run `/Users/airliner/ae-auto-subtitles/scripts/create_subtitles.jsx`
6. Select `tmp/subtitles.json` and choose preset/mode.

## 5) CEP panel install
Enable CEP debug mode:
```bash
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
```

Create CEP extensions folder and symlink panel:
```bash
mkdir -p "$HOME/Library/Application Support/Adobe/CEP/extensions"
ln -snf /Users/airliner/ae-auto-subtitles/panel "$HOME/Library/Application Support/Adobe/CEP/extensions/com.airliner.aeautosubtitles"
```

Then restart AE and open:
- `Window -> Extensions -> AED Subtitles`

The packaged installer includes the CEP panel, backend scripts, offline wheels,
bundled ffmpeg, and the `turbo` faster-whisper model when it is available in the
builder cache. The panel defaults to `turbo`; if the model is not bundled, the
first transcription may download it through faster-whisper/Hugging Face.

Panel buttons:
- `Scan` / `Rescan`: read active comp audio layers and select all file-backed layers by default
- `Retiming`: regenerate `tmp/raw.json` + `tmp/subtitles.json` from the current audio/model
- `Run`: apply the current queued transcription/style to AE
- `Apply Changed`: update only captions changed by reference text
- `Native QA`: run syntax, unit, AE layout, and AE timing checks

Workflow (no manual file paths needed):
1. Open the target comp in AE.
2. Open `Window -> Extensions -> AED Subtitles`.
3. Click `Rescan` if the timeline changed.
4. Let background Whisper finish or click `Retiming`, review captions, choose style, then click `Run`.

## 6) Common errors
- `ffmpeg is not installed`: install via Homebrew and retry.
- `Missing dependency: faster-whisper`: activate `.venv` and reinstall requirements.
- `No target comp`: open an active comp in AE before running Create/Full Run.
- `No speech detected`: input likely has no dialogue or very low voice level.
