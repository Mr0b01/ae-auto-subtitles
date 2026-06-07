# Contributing

Thanks for improving AED Subtitles. This project has two user surfaces: the CEP panel inside After Effects and the local Python transcription/postprocessing backend.

## Before You Start

1. Install the extension using [install.md](install.md).
2. Reproduce the issue in After Effects if the change affects rendering, timing, layout, or sources.
3. Keep changes scoped. Avoid broad rewrites unless the behavior is already protected by tests.

## Development Setup

```bash
git clone https://github.com/Mr0b01/ae-auto-subtitles.git
cd ae-auto-subtitles
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

Symlink the panel:

```bash
mkdir -p "$HOME/Library/Application Support/Adobe/CEP/extensions"
ln -snf "$(pwd)/panel" \
  "$HOME/Library/Application Support/Adobe/CEP/extensions/com.airliner.aeautosubtitles"
```

## Verification

Run the cheap checks before opening a pull request:

```bash
sh scripts/preflight.sh
```

For AE renderer or timing changes, also run Native QA from the installed panel. If your local AE runner lives somewhere custom, set:

```bash
export AEAS_AE_RUNNER="/path/to/after-effects/scripts/runner.sh"
```

## Pull Request Notes

Include:

- what changed
- why it changed
- what was tested
- what was not tested
- screenshots or timing evidence for visual changes
