# AED Subtitles Project Log

This file is the running project log for the AE auto-subtitles panel. Keep it current after each meaningful change.

## Current State

- Installed CEP extension path: `$HOME/Library/Application Support/Adobe/CEP/extensions/com.airliner.aeautosubtitles`
- Current version: `1.0.135`
- Main UI: `panel/index.html`
- Panel logic: `panel/main.js`
- AE renderer: `scripts/create_subtitles.jsx`
- Transcription/postprocess: `backend/`
- Tests: `tests/test_smoke.py`

## Standing Product Direction

- The plugin should feel closer to Descript-style caption editing: generate, review, edit, style, then apply.
- Preview must match AE render as closely as possible, especially text size, wrapping, box/background placement, stroke, and subtitle position.
- Reference text is important: it should correct Whisper output, fill missed speech, and preserve rhythm/timing instead of blindly replacing words in sequence.
- Hinglish / Indo-English should stay in Latin text, not Devanagari or other scripts.
- Users should stay in the active composition while captions are applied; the panel should show waiting/progress state.
- A top `Position` null remains a future/opt-in control goal, but it must not be created or touched during normal Apply until its coordinate handling is stable.

## Recent Changes

### 1.0.135

- Added public repository hardening: local preflight checks, issue templates, contributing/security docs, architecture/troubleshooting/release docs, and a dependency-free `scripts/check_public_hygiene.py`.
- Public hygiene now checks tracked files for local machine paths, generated/cache artifacts, stale installer links, missing README assets, and missing current release notes.
- Replaced local-only sample command examples with generic `/path/to/video.mp4` examples and ignored local `samples/` media.
- Replaced generated README hero art with real screenshots captured from `panel/index.html`: full panel, style workbench, and review captions crops.
- Fixed the timeline "red shard staircase" failure in montage comps by making checked `Active comp mix` truly run first. File-backed sources remain available as a manual fast path, but they are no longer auto-checked when comp mix is the default.
- Root cause verified in active comp `01`: the panel transcribed 9 separate file-backed layers, including short B-roll/audio clips, and accepted an impossible raw item (`19` words in `0.04s`). AE then faithfully created one-frame subtitle layers from that bad JSON.
- Added backend/postprocess guards that drop punctuation-only transcript items and dense hallucinated captions whose text cannot physically fit in the reported duration.
- Verification: `node --check panel/main.js`, Python compile checks, targeted dense-timing tests, and `python -m unittest discover -s tests` passed after syncing the installed CEP copy.

### 1.0.134

- Fixed skipped audio slices in montage-style comps: file-backed timeline sources are now all selected by default instead of only the two longest layers.
- Root cause seen in active comp `06`: enabled audio existed from `43.4s` to `94.43s`, but subtitles jumped from `43.4s` to `94.233s` because only the longest file sources were transcribed.
- Active comp mix remains available, but the fast source path now covers all sliced file-backed voice layers before falling back.
- Prepared GitHub release hygiene for `v1.0.134`: source `.gitignore`, current behavior docs, release notes, and packaging version are aligned to `VERSION`.
- Packaging now derives the installer version from `VERSION`, names the asset `AE-Auto-Subtitles-Installer-1.0.134.pkg`, and bundles the cached Whisper Turbo model when available.
- Verification: `node --check panel/main.js`, JSX syntax check, Python compile checks, `python -m unittest discover -s tests`, and the installed CEP copy's `scripts/native_qa.py` all passed after syncing the installed CEP copy.

### 1.0.133

- Made Whisper Turbo the default recognition model on panel load (`turbo` in the UI, panel fallbacks, and backend CLI default).
- Kept `small`, `medium`, and `large-v3` as manual fallback choices.
- Verification: confirmed local faster-whisper `1.2.1` supports `turbo`; `node --check panel/main.js`, `python -m py_compile backend/transcribe.py`, `python -m unittest discover -s tests`, and the installed CEP copy's `scripts/native_qa.py` all passed after syncing the installed CEP copy.

### 1.0.132

- Added `Apply Changed` in Review Captions for reference-text patching: it writes `tmp/reference_changed_subtitles.json` with only captions whose reference text differs from the model/original caption.
- Added AE apply mode `patch_changed`; cleanup is skipped in this partial mode so unchanged existing subtitle layers are not disabled or deleted.
- The patch flow requires `Output Mode = Layers`, because a single keyed text layer cannot safely replace individual caption ids.
- Verification: `node --check panel/main.js`, JSX syntax check, `python -m unittest discover -s tests`, and the installed CEP copy's `scripts/native_qa.py` passed after syncing the installed CEP copy. Browser `file://` smoke was blocked by Browser Use URL policy, so UI presence is covered by unit smoke tests for this pass.

### 1.0.131

- Fixed the installed-panel `Native QA` path: when `scripts/native_qa.py` is launched from the CEP extension copy, it now resolves back to the real repo root so unit tests, AE self-tests, and sync checks can actually run.
- Re-synced the installed CEP extension after detecting `scripts/create_subtitles.jsx` drift between repo and CEP copy.
- Verification: `node --check panel/main.js`, JSX syntax check, `python -m unittest discover -s tests`, and running the installed CEP copy's `scripts/native_qa.py` all passed. Installed browser smoke found version `1.0.131`, visible `Native QA`, visible preview, console errors `0`, horizontal overflow `0`, and preview self-test lines `ki tumhari shaadi / kisse hogi?`.

### 1.0.130

- Fixed chunk/karaoke timing drift by preserving real word `start/end` timestamps when splitting long captions into AE layers. The old visual redistribution path remains available only when `redistributeChunkTimings` is explicitly enabled.
- Stopped same-base chunk timing stabilization from bridging large word gaps; it now only closes tiny gaps/overlaps instead of stretching one chunk across a real pause.
- Added `scripts/verify_ae_timing.py`, a real AE timing self-test that creates chunked subtitle layers and verifies their actual `inPoint/outPoint` against word timestamps.
- Wired the AE timing self-test into `scripts/native_qa.py`, so the panel `Native QA` button now checks syntax, unit tests, preview/layout parity, and real AE timing.
- Verification: `python scripts/native_qa.py` passed with JS/JSX/Python syntax, 56 unit tests, real AE layout self-test, and real AE timing self-test. Browser smoke on localhost found version `1.0.130`, visible `Native QA`, console errors `0`, and horizontal overflow `0`.

### 1.0.129

- Added `scripts/native_qa.py` as the one-command native QA runner: it checks JS/JSX/Python syntax, preview parity guards, unit smoke tests, and the real AE layout self-test, then writes `tmp/native_qa_report.json`.
- Added a `Native QA` button in the Run Status card so the panel can run the same native QA path with progress overlay/status output.
- Added a generic panel-side repo Python runner for non-transcription QA scripts, with AE `system.callSystem` fallback when the CEP Node bridge is unavailable.
- Verification: `python scripts/native_qa.py` passed and wrote `tmp/native_qa_report.json`; `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py scripts/verify_ae_layout.py scripts/native_qa.py`, and `python -m unittest discover -s tests` passed after CEP sync. Localhost UI smoke found `Native QA` visible in the Run Status actions with no horizontal overflow.

### 1.0.128

- Added a real AE layout self-test: `scripts/verify_ae_layout.py` creates a temporary AE comp, applies the production subtitle renderer, reads actual `Source Text` line breaks from AE layers, checks for orphan edge-word layouts, then removes the temp comp.
- Added `scripts/ae_layout_selftest.jsx` as the AE-side harness for that test.
- Exposed a small `window.AEAS_TEST_HOOKS.computePreviewLayout(...)` diagnostic hook so localhost browser smoke tests can inspect preview line breaks without touching production UI controls.
- Fixed the actual preview/render mismatch found by the new hook: preview used an overflow score of `100000` while AE used `1000`, so the UI over-wrapped text into extra rows. Preview now uses the same overflow weight as the AE renderer.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, stripped-include syntax check for `scripts/ae_layout_selftest.jsx`, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py scripts/verify_ae_layout.py`, `python -m unittest discover -s tests`, `python scripts/verify_ae_layout.py`, and localhost browser preview hook all passed. The `ki tumhari...` case matched: preview and AE both produced `ki tumhari shaadi / kisse hogi?`.

### 1.0.127

- Tightened AE and UI caption line balancing so layouts with orphan one-word lines, especially an edge word like `ki` above a full phrase, receive a heavy penalty and should lose to balanced two/three-word rows.
- Added the same orphan-line penalty to the preview layout picker so preview and AE make the same line-break decision.
- Cleaned stale `AEAS__LAYERS_MEASURE` helper layers before and after layer rendering; old failed runs had left one selected in the active comp.
- Font picker now opens a loading panel while the AE font catalog is being verified, even when cached fonts exist, instead of showing a stale list with no wait state.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync. AE active-comp inspection on `01` found 14 subtitle layers, `measureHelpers=[]`, and `backgroundHelpers=[]`.

### 1.0.126

- Fixed a repeat-Run styling leak where existing `Source Text` keyframes could survive a preset change and keep old active-word stroke/background-looking styles on words like `ki`.
- Clean per-layer caption writes now clear old Source Text keys and reset document styles before applying the current preset, so disabled stroke/backplate settings actually take effect.
- Clean/non-background presets now purge generated background helper layers by prefix (`SUBUNIT__`, `SUBLINE__`, `LINEBOX__`, `BOX__`, `SUBWORD__`) instead of relying on exact id matches.
- Removed visible Backplate presets/toggle from the normal UI while keeping the engine code/config for later rebuild.
- Re-applied the current active comp (`01`) with the fixed renderer; AE reported `updated=14`, `succeeded=14`, `total=14`. Follow-up inspection found `backgroundHelpers=[]` and `SUB__0002.sourceTextKeys=0`.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.125

- Fixed the preview/render mismatch caused by UI readability defaults not being sent to AE Apply. `Run` now stamps the visible font size, max lines, block width, block scale, leading, tracking, stroke width, stroke state, and offsets into `captionLayout.styleOverrides`.
- Added a visible `Max Lines` control and wired it through preview, subtitle JSON preflight, and `create_subtitles.jsx`, so AE line balancing is capped by the same value shown in the panel.
- Made oversized caption/reference chunks split by visual word budget, not only by character count, so long Hinglish/reference captions do not collapse into one 4-line AE layer while the UI shows a smaller block.
- The caption preview now defaults to a real transcript stress caption and clicking a Review Captions row previews that row; `New Quote` still randomizes manually.
- Fixed preview mouse scaling by replacing the stale `event.clientX/Y` access inside the drag move handler with the passed pointer coordinates.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync. Browser file-url smoke remains blocked by the Browser URL policy.

### 1.0.124

- Replaced the visible HugLines/background path with a new Backplate system.
- Visible presets are now `backplate_bold`, `backplate_stack`, and `backplate_yellow`; old HugLines labels/options are removed from the UI.
- Backplates render through isolated per-caption precomps: the main comp gets a `SUBUNIT__...` layer, while text and `BACKPLATE__...` shape layers live together inside `AEAS_BACKPLATE_UNIT__...`, so text and background share one coordinate system instead of drifting across comp/parent spaces.
- Legacy `BOX__...` and `LINEBOX__...` code remains for compatibility, but new Backplate styles do not use it.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync. Browser file-url smoke was blocked by the Browser URL policy, so UI verification was limited to tests/static checks.

### 1.0.123

- Increased AE subtitle Apply watchdog from 30s to 120s because real Apply completed successfully after the panel had already timed out.
- Added a timeout fallback that reads `tmp/apply_status.json`; if ExtendScript reached `stage=done`, the panel now returns that success detail instead of reporting a false failure.
- If AE is still genuinely busy, the panel error now includes the last `apply_status` stage/detail instead of only the generic watchdog message.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.122

- Added a Descript-style caption document preflight before every save/apply: `tmp/subtitles.json` is now the prepared source of truth, not a loose transcript plus hidden AE-side fixes.
- The preflight normalizes timeline offsets, splits oversized captions in the JSON itself, reapplies word rules after splitting, ensures ids, and stamps a `captionLayout` snapshot with preset/output/font/max-chars/style overrides.
- `createInAe` now prepares the current subtitles file before handing it to ExtendScript, so Review, exports, and AE Apply use the same caption document.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.121

- Normalized subtitle JSON timing before Review/Apply: large source/display offsets are now physically subtracted from `items[].start/end` and word timings, so AE receives captions starting at `0.0` instead of only hiding the offset in UI labels.
- Added metadata (`timelineNormalizedToZero`, `timelineNormalizationOffset`) so the shift is applied once and exports/review no longer double-subtract display start.
- This fixes cases where Review showed zero after display correction but AE layers still landed at internal `34.4s`.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.120

- Review Captions and SRT/VTT export now display caption times relative to the active composition ruler by subtracting `comp.displayStartTime`.
- Timeline scan stores `compDisplayStartTime` in source data and subtitle metadata so internal AE times can remain correct while the UI shows `00:00` when the comp ruler starts there.
- This fixes cases where captions are internally at `34.4s` because of AE display-start offset, while the visible timeline starts at zero.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.119

- Added an AE-side safety splitter before layer creation: any subtitle item that is too long for one AE text layer is split into short timed chunks even if the backend/reference pass accidentally leaves it as one giant item.
- Fixed cleanup expectations so old unsplit layers like `SUB__0023` are no longer considered valid when the renderer creates `SUB__0023__01`, `SUB__0023__02`, etc.
- Added per-item renderer status stages (`item_fit`, `item_text`, `item_style`, `item_line_box`, `item_word_box`, `item_done`) so a future stall names the exact operation, not only the subtitle id.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.118

- Disabled automatic `Position` null creation/parenting by default; it now runs only when a preset explicitly sets `autoParentToPosition: true`.
- Normal Apply now keeps subtitle layers in comp coordinates and skips the parent/control pass, removing the path that shifted text away from the centered Null and could make AE appear stuck.
- Added regression checks that the auto-parent path is opt-in and that the renderer reports `position_control_skip` / `parent_skip` instead of silently touching Null control state.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.117

- Added JSX apply-stage telemetry at `tmp/apply_status.json` so the next hang shows the last exact renderer stage.
- Stopped moving the CTI and selecting subtitle layers after Apply; this avoids triggering heavy viewport redraw immediately after layer creation.
- Reduced subtitle Apply watchdog from 90s to 30s because 18 captions should not require a long blocking AE call.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.116

- Added watchdog timeouts around CEP `evalScript` calls so the panel no longer spins forever when AE is busy or stuck.
- Font loading and timeline scan now fail fast, subtitle Apply reports a stuck AE step, and active comp audio render keeps a long explicit timeout for legitimate renders.
- This does not kill AE or the project; it makes the panel recover and show the stuck stage instead of pretending work is still progressing.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.115

- Reduced stroke overhead by treating stroke as enabled only when both `strokeEnabled` is true and `strokeWidth > 0`.
- AE render-order forcing now runs only for real positive-width strokes, while zero-width stroke styles disable stroke instead of carrying text stroke options around.
- Regression coverage checks the positive-width guard so stroke stays behind fill when used without slowing zero-stroke styles.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.114

- Fixed AE text stroke render order so increased stroke stays behind the fill instead of eating into the glyphs.
- `_applyTextLayerStrokeRenderOptions` now forces `All Fills Over All Strokes` with the correct AE scripting value (`2`) and includes the legacy `text.moreOption.fillANdStroke` fallback.
- Regression coverage now checks the exact render-order constant and fallback assignment.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.113

- Added backend timing stabilization for overlapping STT segments before postprocess/reference text.
- `_stabilize_timeline_items` now clamps consecutive raw transcript items so the next caption cannot start before the previous one ends, and refits word timings into the corrected boundaries.
- Added a regression test for the real overlap pattern seen in logs (`11.96-14.98` followed by `13.5-15.68`).
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, `python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py`, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.112

- Tightened the reference cadence guard after real logs still showed sub-second, high words-per-second captions.
- `shouldMergeTinyReferenceCaption` now checks duration, words per second, and characters per second; `mergeTinyReferenceCaptions` repeats until the list stabilizes instead of doing one pass.
- This prevents long reference text from being split into readable-text-but-unreadable-timing micro layers.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, and `python -m unittest discover -s tests` passed after CEP sync. Also normalized the currently installed `tmp/subtitles.json`, merging 7 remaining fast captions into 6 readable captions.

### 1.0.111

- The top live status now shows the currently selected STT model.
- After transcription/retiming/full Run, `tmp/subtitles.json` stores `meta.sttModel` and `meta.sttModelLabel`.
- Review Captions now displays the actual model used for the current subtitles and warns when the selected model has changed and Retiming is needed.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.110

- Added a reference caption cadence guard so reference-text splitting cannot create unreadable micro captions.
- New `mergeTinyReferenceCaptions(items)` merges captions shorter than `0.65s` (or very short 1-3 word captions) into the nearest neighbor before IDs are repaired and AE layers are created.
- Added metadata `referenceTextCadenceMergedCaptions` and smoke coverage for the guard.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.109

- Made the requested style/settings the standard baseline: default preset is now `Bold: Yellow highlight`, Size `48`, Stroke Width `0`, Max Chars `42`, Block Width `900`, Block Scale `91`, Offset Y `+224`, Offset X `0`, with Stroke/Hug toggles off by default.
- Updated initial HTML values and smoke tests so reset/opening state matches this baseline.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.108

- Fixed a real subtitle gap bug caused by duplicate caption IDs after reference-text overflow splitting.
- `ensureUniqueCaptionIds(payload)` now repairs empty, synthetic, or repeated IDs before subtitles are written, so AE no longer reuses the same `SUB__xxxx` layer name and silently replaces/skips captions.
- This addresses the case where Review Captions contained the text, but the AE timeline had pauses because fewer subtitle layers were actually created than JSON items.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.107

- Kept `Active comp mix` visible as the standard safety option, but stopped making it the automatic first transcription path when file-backed audio sources exist.
- Scan/background Whisper now selects the top two timeline audio files and transcribes those first; comp mix is used first only after a manual comp-mix choice, when nested/precomp audio exists, or when no file-backed sources are selected.
- The “few captions found” comp-mix retry is now limited to comps with nested/precomp audio, so short normal clips do not render the whole comp just because they have fewer than 12 subtitle items.
- Added status/summary wording for the new fast-source-first strategy so the panel explains when comp mix is fallback instead of immediately rendering the whole AE comp.
- Verification: `node --check panel/main.js`, JSX syntax check via temporary `.js` copy, and `python -m unittest discover -s tests` passed after CEP sync.

### 1.0.106

- Made the requested quick-control values the standard readability defaults: Size `61`, Stroke Width `0`, Max Chars `42`, Block Width `880`, Block Scale `91`, Offset Y `+224`, Offset X `0`.
- Added `STANDARD_READABILITY_DEFAULTS` in `panel/main.js` so preset changes and resets normalize to this baseline in the panel.
- Updated initial HTML slider values to match the new standard before JavaScript sync runs.
- Verification: syntax checks passed before CEP sync; full test suite rerun after CEP sync.

### 1.0.105

- Made `Active comp mix` the default selected audio source whenever it is available after Scan.
- File-backed timeline sources stay available for manual override, but Scan now resets the default to the audible comp mix because it best matches what AE actually plays.
- Verification: syntax checks passed before CEP sync; full test suite rerun after CEP sync.

### 1.0.104

- Disabled automatic parenting of subtitle text layers to the `Position` null.
- Existing subtitle layers parented to `Position` are detached while preserving comp-space position, so reruns should repair previously shifted layers.
- The `Position` null remains as a visible control marker, but generated text layers keep direct comp-space coordinates until a safer AE transform strategy is validated.
- Verification: syntax checks passed before CEP sync; full test suite rerun after CEP sync.

### 1.0.103

- Changed `Position` null parenting order for subtitle text layers.
- Text, line-text, and word-overlay layers are now parented to `Position` before layout, positioning, and position keyframes are written.
- This avoids AE treating comp-space coordinates as local coordinates after end-of-render parenting, which caused subtitles to appear down/right outside the frame.
- Verification: syntax checks passed before CEP sync; full test suite rerun after CEP sync.

### 1.0.102

- Added a second-pass reference distribution guard.
- If reference alignment assigns too many words/characters to one caption, the overflow is split into additional timed reference captions inside the same time window.
- This prevents Review Captions and AE output from showing one giant paragraph when a long inserted reference span attaches to a single Whisper item.
- Added metadata: `referenceTextOverflowSplitCaptions`.
- Verification: syntax checks passed before CEP sync; full test suite rerun after CEP sync.

### 1.0.101

- Fixed subtitle layers jumping down/right after being parented to the `Position` null.
- `_parentLayerPreservingWorldTransform` now manually stores a layer's comp-space position before parenting and writes it back through parent-space after parenting.
- This covers AE builds where `setParentWithJump` is unavailable or unreliable and prevents fallback `layer.parent = control` from treating comp coordinates as local coordinates.
- Verification: syntax checks passed before CEP sync; full test suite rerun after CEP sync.

### 1.0.100

- Fixed parent-space positioning when subtitle layers are already parented to the `Position` null.
- Added helpers in `create_subtitles.jsx` to set/read layer positions in comp space even when a parent exists.
- Moved/maintained `Position` null at the subtitle block center rather than blindly at comp center.
- Reset box shape parent state before recalculating smart box expressions to avoid double offsets.
- Verification: `node --check panel/main.js`, JSX syntax check via copied `.js`, and `python -m unittest discover -s tests` all passed.

### 1.0.99

- Added short reference-gap absorption.
- Short or empty `REFERENCE GAP` captions are merged into a neighboring caption instead of becoming visible empty/awkward timeline gaps.
- Added metadata: `referenceTextAbsorbedGapCaptions`.
- Verification passed with 52 tests.

### 1.0.98

- Improved preview and AE line wrapping so `Max Chars` and `Block Width` prefer balanced rectangular caption blocks instead of narrow vertical columns.
- Prevented browser preview lines from wrapping inside already-calculated rows.
- Applied matching balanced layout logic to AE renderer.
- Verification passed with 52 tests.

## Known Fragile Areas

- AE shape/background rendering is sensitive to parent transforms and expression coordinate spaces.
- Re-running Apply on already-parented layers can introduce offset bugs if positions are written in local space.
- Preview and AE can diverge if CSS wrapping or JSX line-fitting changes in only one place.
- Reference text timing still needs careful testing on real clips with long Whisper misses.
- Word-level timing can still feel early/late when Whisper word timestamps are poor.

## Verification Checklist

Run after meaningful code changes:

```sh
node --check panel/main.js
tmp_jsx="/tmp/aeas_create_subtitles_check_$$.js"; cp scripts/create_subtitles.jsx "$tmp_jsx"; node --check "$tmp_jsx"; rc=$?; rm -f "$tmp_jsx"; exit $rc
python -m unittest discover -s tests
python scripts/verify_ae_layout.py
python scripts/verify_ae_timing.py
python scripts/native_qa.py
```

Sync installed CEP copy before final full test when extension files changed:

```sh
dest="$HOME/Library/Application Support/Adobe/CEP/extensions/com.airliner.aeautosubtitles"
cp VERSION "$dest/VERSION"
cp config/presets.json "$dest/config/presets.json"
cp scripts/create_subtitles.jsx "$dest/scripts/create_subtitles.jsx"
cp scripts/ae_layout_selftest.jsx "$dest/scripts/ae_layout_selftest.jsx"
cp scripts/verify_ae_layout.py "$dest/scripts/verify_ae_layout.py"
cp scripts/verify_ae_timing.py "$dest/scripts/verify_ae_timing.py"
cp scripts/native_qa.py "$dest/scripts/native_qa.py"
cp panel/main.js "$dest/main.js"
cp panel/index.html "$dest/index.html"
cp panel/style.css "$dest/style.css"
cp panel/CSXS/manifest.xml "$dest/CSXS/manifest.xml"
cp backend/transcribe.py "$dest/backend/transcribe.py"
cp backend/postprocess.py "$dest/backend/postprocess.py"
cp backend/io_json.py "$dest/backend/io_json.py"
```

## Logging Rule

- Add a new entry under `Recent Changes` after every completed fix.
- Include the version, user-facing behavior, important implementation note, and verification result.
- Keep known risks honest and current.
