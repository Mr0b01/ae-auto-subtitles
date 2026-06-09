# Architecture

AED Subtitles is a local Adobe After Effects CEP extension with a Python transcription backend and an ExtendScript renderer.

## Main Parts

| Area | Path | Responsibility |
| --- | --- | --- |
| CEP panel | `panel/` | User interface, source scanning, style controls, review captions, AE bridge calls. |
| Python backend | `backend/` | Audio extraction, Whisper transcription, subtitle postprocessing. |
| ExtendScript renderer | `scripts/create_subtitles.jsx` | Creates and updates native AE subtitle text layers. |
| Native QA | `scripts/native_qa.py` | Runs syntax, unit, AE layout, and AE timing checks. |
| Presets | `config/presets.json` | Style defaults used by the panel and renderer. |
| Packaging | `packaging/` | Builds the macOS `.pkg` installer and installs the CEP extension. |

## Runtime Flow

```text
After Effects comp
  -> CEP panel scan
  -> audio source selection
  -> Python backend / faster-whisper
  -> tmp/raw.json
  -> postprocess
  -> tmp/subtitles.json
  -> Review Captions
  -> ExtendScript renderer
  -> native AE text layers
```

## Source Strategy

`Active comp mix` is the default source. It transcribes the audible composition mix instead of guessing which file-backed layers matter. Manual file-backed sources remain available for deliberate clip-level transcription.

## Reference Text

Reference text is applied after model transcription. The aligner compares the model transcript against known-correct text, updates changed captions, fills missed Whisper gaps, and marks captions whose text came from reference alignment.

The review layer keeps source status visible before rendering:

- model-only captions
- reference-matched captions
- reference-changed captions
- synthetic reference-gap captions

Layout controls such as `Max Chars`, `Max Lines`, `Block Width`, and `Block Scale` are part of the caption document metadata so the reviewed text can be split into blocks before AE layers are created.

## AE Rendering

`scripts/create_subtitles.jsx` is the production renderer. It reads `tmp/subtitles.json`, resolves style presets, chunks captions when needed, and creates editable AE text layers.

Dark backplate and Hug Lines renderers are not the stable default path in the current release.

## QA Boundary

`scripts/preflight.sh` runs public hygiene, syntax checks, and unit smoke tests. Real AE layout/timing checks require an installed After Effects environment and are run through Native QA.
