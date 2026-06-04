# Regression Checklist

Run each check twice in a row before release.

## Backend
- [x] `extract_audio` generates 16k mono WAV from `samples/sample.mp4`
- [x] `transcribe` produces non-empty `tmp/raw.json`
- [x] `postprocess_subtitles` produces `id/start/end/text/lines[]`
- [x] `full_run` completes and writes `tmp/subtitles.json`

## AE timing / rendering
- [ ] 24 fps comp: verify in/out alignment by eye
- [ ] 25 fps comp: verify in/out alignment by eye
- [ ] 29.97 fps comp: verify in/out alignment by eye
- [ ] Preset `minimal` visual check
- [ ] Preset `box` visual check (shape auto-resize)
- [ ] Preset `bold` visual check
- [ ] `update_existing`: rerun without duplicate `SUB__{id}` layers

## Error handling
- [ ] Missing `ffmpeg` surfaces clear error
- [ ] Missing `faster-whisper` surfaces clear error
- [ ] No active comp surfaces clear AE error in panel/script
- [ ] No speech input surfaces user-facing warning
