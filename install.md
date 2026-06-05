# AED Subtitles Installation Guide

This is the normal installer path for editors. Manual development setup is included at the end.

## Download

- [Latest release](https://github.com/Mr0b01/ae-auto-subtitles/releases/latest)
- [Direct installer download](https://github.com/Mr0b01/ae-auto-subtitles/releases/latest/download/AE-Auto-Subtitles-Installer-1.0.135.pkg)

## Install

1. Download `AE-Auto-Subtitles-Installer-1.0.135.pkg`.
2. Run the package installer.
3. Restart Adobe After Effects.
4. In AE, enable `Settings -> Scripting & Expressions -> Allow Scripts to Write Files and Access Network`.
5. Open `Window -> Extensions -> AED Subtitles`.

If macOS blocks the unsigned installer, right-click the `.pkg`, choose `Open`, then confirm.

## First Run

1. Open the composition you want to caption.
2. Open `Window -> Extensions -> AED Subtitles`.
3. Keep `Active comp mix` selected unless you intentionally want a manual source.
4. Press `Scan` or `Rescan`.
5. Wait for background Whisper Turbo or press `Retiming`.
6. Review captions.
7. Choose style, font, size, and placement.
8. Press `Run`.

## What The Installer Places On Disk

The extension is installed for the current user:

```text
$HOME/Library/Application Support/Adobe/CEP/extensions/com.airliner.aeautosubtitles
```

The package includes:

- CEP panel UI
- local Python backend scripts
- ExtendScript renderer
- offline Python wheels
- bundled ffmpeg
- cached Whisper Turbo model when available

If the Turbo model is not bundled, the first transcription may download it automatically.

## Panel Controls

| Control | What it does |
| --- | --- |
| `Scan` / `Rescan` | Reads active comp audio sources and prepares transcription. |
| `Active comp mix` | Transcribes the audible comp mix exactly as heard. |
| `Retiming` | Regenerates transcript and caption timings from current audio/model. |
| `Review Captions` | Shows the current subtitles before AE layers are created. |
| `Reference Text` | Aligns known-correct text against the model transcript. |
| `Apply Changed` | Updates only captions whose text changed from the reference pass. |
| `Run` | Creates editable AE subtitle layers. |
| `Native QA` | Runs syntax, unit, AE layout, and AE timing self-tests. |

## Troubleshooting

### The panel does not appear

Restart AE, then check `Window -> Extensions -> AED Subtitles`.

### AE refuses to create subtitle layers

Enable `Settings -> Scripting & Expressions -> Allow Scripts to Write Files and Access Network`, then restart AE.

### The first transcription takes a long time

The first Turbo run may download the model. Later runs use the local cache.

### Captions are shifted or stale

Press `Rescan`, keep `Active comp mix`, then press `Retiming`.

### Captions are missing in montage edits

Use `Active comp mix`. Manual file-backed layers are useful only when you know the exact clips that contain voice.

## Manual Development Setup

```bash
cd /Users/airliner/ae-auto-subtitles
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

Enable CEP debug mode:

```bash
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
```

Symlink the panel:

```bash
mkdir -p "$HOME/Library/Application Support/Adobe/CEP/extensions"
ln -snf /Users/airliner/ae-auto-subtitles/panel \
  "$HOME/Library/Application Support/Adobe/CEP/extensions/com.airliner.aeautosubtitles"
```

Restart After Effects and open `Window -> Extensions -> AED Subtitles`.

## Smoke Test

```bash
source .venv/bin/activate
python backend/transcribe.py --full_run \
  --input samples/sample.mp4 \
  --out tmp/raw.json \
  --subtitles_out tmp/subtitles.json \
  --model turbo
```
