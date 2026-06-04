import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INSTALLED_ROOT = Path(
    "/Users/airliner/Library/Application Support/Adobe/CEP/extensions/com.airliner.aeautosubtitles"
)


class SmokeTests(unittest.TestCase):
    def test_panel_main_js_syntax(self):
        result = subprocess.run(
            ["node", "--check", str(ROOT / "panel" / "main.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

    def test_create_subtitles_jsx_syntax(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            check_path = Path(tmpdir) / "create_subtitles_check.js"
            shutil.copyfile(ROOT / "scripts" / "create_subtitles.jsx", check_path)
            result = subprocess.run(
                ["node", "--check", str(check_path)],
                capture_output=True,
                text=True,
                check=False,
            )
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

    def test_presets_json_valid(self):
        with open(ROOT / "config" / "presets.json", "r", encoding="utf-8") as fh:
            data = json.load(fh)
        self.assertIsInstance(data, dict)
        self.assertIn("classic_clean", data)
        self.assertIn("modern_yellow", data)
        self.assertIn("impact_yellow", data)
        self.assertEqual(data["classic_clean"]["displayName"], "Classic")

    def test_panel_html_contains_critical_hooks(self):
        html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        ids = set(re.findall(r'id="([^"]+)"', html))
        required_ids = {
            "btnFullRun",
            "btnScanSources",
            "btnRefreshTimings",
            "btnApplyChangedCaptions",
            "btnCopyLog",
            "btnNativeQa",
            "liveStatus",
            "runProgress",
            "runProgressLabel",
            "runProgressFill",
            "sourcesList",
            "transcriptReviewList",
            "transcriptReviewMeta",
            "btnCopyCaptions",
            "btnExportSrt",
            "btnExportVtt",
            "preset",
            "presetPicker",
            "presetPickerButton",
            "presetPickerLabel",
            "presetPickerPreview",
            "presetPickerMenu",
            "outputModePicker",
            "outputModePickerButton",
            "outputModePickerLabel",
            "outputModePickerPreview",
            "outputModePickerMenu",
            "fontSelect",
            "fontPickerButton",
            "fontPickerSpinner",
            "fontPickerMenu",
            "outputMode",
            "languagePicker",
            "languagePickerButton",
            "languagePickerLabel",
            "languagePickerPreview",
            "languagePickerMenu",
            "outputModeHint",
            "summaryVersion",
            "stylePalette",
            "stylePreviewStage",
            "stylePreviewCaption",
            "stylePreviewText",
            "stylePreviewMeta",
            "layoutPreviewOffsetX",
            "maxLinesControl",
            "blockWidthControl",
            "blockScaleControl",
            "boxSmartControl",
            "boxPaddingControl",
            "boxRoundnessControl",
            "layoutPreviewChars",
            "layoutPreviewLines",
            "layoutPreviewMargin",
        }
        self.assertTrue(required_ids.issubset(ids), msg=f"Missing ids: {sorted(required_ids - ids)}")
        slider_ids = set(
            re.findall(r'id="([^"]+)"[^>]*type="range"', html) +
            re.findall(r'type="range"[^>]*id="([^"]+)"', html)
        )
        self.assertTrue(
            {"fontSizeControl", "maxLinesControl", "blockWidthControl", "blockScaleControl", "leadingControl", "trackingControl", "strokeWidthControl", "boxPaddingControl", "boxRoundnessControl", "boxOpacityControl", "maxChars", "marginY", "marginX"}.issubset(slider_ids),
            msg=f"Missing range sliders: {sorted({'fontSizeControl', 'maxLinesControl', 'blockWidthControl', 'blockScaleControl', 'leadingControl', 'trackingControl', 'strokeWidthControl', 'boxPaddingControl', 'boxRoundnessControl', 'boxOpacityControl', 'maxChars', 'marginY', 'marginX'} - slider_ids)}",
        )
        handle_modes = set(re.findall(r'data-preview-handle="([^"]+)"', html))
        self.assertTrue({"width", "padding", "scale"}.issubset(handle_modes))
        self.assertEqual(html.count('data-preview-handle="scale"'), 4)

    def test_style_controls_are_first_work_surface(self):
        html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        css = (ROOT / "panel" / "style.css").read_text(encoding="utf-8")
        self.assertIn('<section class="panel-card style-card">', html)
        self.assertLess(html.index('class="panel-card sources-card"'), html.index('class="panel-card transcript-card"'))
        self.assertIn(".style-card {\n  order: 1;", css)
        self.assertIn(".sources-card {\n  order: 2;", css)
        self.assertIn(".style-workbench {\n  display: grid;", css)
        self.assertIn("grid-template-columns: minmax(380px, 0.95fr) minmax(420px, 1.05fr);", css)
        self.assertIn(".single-preview-card {\n  order: 1;", css)
        self.assertIn(".compact-style-grid {\n  order: 2;", css)
        self.assertIn("grid-template-columns: repeat(2, minmax(0, 1fr));", css)
        self.assertIn(".advanced-style-details {\n  order: 3;\n  flex: 1 0 100%;", css)
        self.assertIn(".style-tuning-panel {\n  order: 1;", css)
        self.assertIn(".style-controls-row {\n  order: 2;", css)
        self.assertIn("width: min(100%, 190px);", css)
        self.assertIn("max-height: 86px;", css)
        self.assertIn(".sources-note {\n  display: none;", css)
        self.assertIn("Compact density pass", css)
        self.assertIn(".style-preview-stage {\n  width: min(100%, 236px);", css)
        self.assertIn(".style-tuning-grid {\n  grid-template-columns: repeat(auto-fit, minmax(178px, 1fr));", css)
        self.assertIn(".slider-field-head {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;", css)
        self.assertIn("cursor: grab;", css)
        self.assertIn("opacity: 0.82;", css)
        self.assertIn(".workflow-steps {\n  display: none;", css)

    def test_postprocess_preserves_words(self):
        sys.path.insert(0, str(ROOT))
        from backend.postprocess import postprocess_subtitles

        raw = {
            "items": [
                {
                    "start": 0.0,
                    "end": 1.6,
                    "text": "This is working",
                    "words": [
                        {"start": 0.0, "end": 0.4, "text": "This"},
                        {"start": 0.4, "end": 0.7, "text": "is"},
                        {"start": 0.7, "end": 1.6, "text": "working"},
                    ],
                }
            ],
            "language": "en",
        }
        out = postprocess_subtitles(raw, max_chars_per_line=42, max_lines=2)
        items = out.get("items", [])
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["text"], "This is working")
        self.assertEqual(len(items[0]["words"]), 3)
        self.assertEqual(items[0]["words"][2]["text"], "working")
        self.assertGreaterEqual(items[0]["words"][2]["end"], items[0]["words"][2]["start"])

    def test_postprocess_does_not_stretch_clean_word_timing(self):
        sys.path.insert(0, str(ROOT))
        from backend.postprocess import postprocess_subtitles

        raw = {
            "items": [
                {
                    "start": 0.0,
                    "end": 2.0,
                    "text": "late words",
                    "words": [
                        {"start": 0.5, "end": 0.72, "text": "late"},
                        {"start": 1.05, "end": 1.28, "text": "words"},
                    ],
                }
            ],
            "language": "en",
        }
        out = postprocess_subtitles(raw, max_chars_per_line=42, max_lines=2)
        words = out["items"][0]["words"]
        self.assertEqual(words[0]["start"], 0.5)
        self.assertEqual(words[0]["end"], 0.72)
        self.assertEqual(words[1]["start"], 1.05)
        self.assertEqual(words[1]["end"], 1.28)

    def test_hinglish_mode_outputs_latin_subtitles(self):
        sys.path.insert(0, str(ROOT))
        from backend.postprocess import postprocess_subtitles
        from backend.transcribe import _display_language, _recognition_language

        raw = {
            "items": [
                {
                    "start": 0.0,
                    "end": 1.8,
                    "text": "वापस आने का कोई चांस?",
                    "words": [
                        {"start": 0.0, "end": 0.35, "text": "वापस"},
                        {"start": 0.35, "end": 0.7, "text": "आने"},
                        {"start": 0.7, "end": 0.95, "text": "का"},
                        {"start": 0.95, "end": 1.25, "text": "कोई"},
                        {"start": 1.25, "end": 1.8, "text": "चांस?"},
                    ],
                }
            ],
            "language": "hinglish",
        }
        out = postprocess_subtitles(raw, max_chars_per_line=42, max_lines=2, romanize_hinglish=True)
        item = out["items"][0]
        self.assertEqual(_recognition_language("hinglish"), "hi")
        self.assertEqual(_display_language("hinglish"), "hinglish")
        self.assertEqual(out["language"], "hinglish")
        self.assertEqual(out["meta"]["output_script"], "latin")
        self.assertEqual(item["text"], "wapas aane ka koi chance?")
        self.assertEqual([word["text"] for word in item["words"]], ["wapas", "aane", "ka", "koi", "chance?"])
        self.assertIsNone(re.search(r"[\u0900-\u097F]", json.dumps(out, ensure_ascii=False)))

    def test_auto_hindi_output_is_romanized_for_ae(self):
        sys.path.insert(0, str(ROOT))
        from backend.postprocess import postprocess_subtitles

        raw = {
            "items": [
                {
                    "start": 0.0,
                    "end": 2.2,
                    "text": "तो मेरे साथ निकला आप पर कमेंट कीजिए,",
                    "words": [
                        {"start": 0.0, "end": 0.2, "text": "तो"},
                        {"start": 0.2, "end": 0.45, "text": "मेरे"},
                        {"start": 0.45, "end": 0.8, "text": "साथ"},
                        {"start": 0.8, "end": 1.05, "text": "निकला"},
                        {"start": 1.05, "end": 1.25, "text": "आप"},
                        {"start": 1.25, "end": 1.45, "text": "पर"},
                        {"start": 1.45, "end": 1.8, "text": "कमेंट"},
                        {"start": 1.8, "end": 2.2, "text": "कीजिए,"},
                    ],
                }
            ],
            "language": "hi",
        }
        out = postprocess_subtitles(raw, max_chars_per_line=42, max_lines=2)
        item = out["items"][0]
        self.assertEqual(out["language"], "hinglish")
        self.assertEqual(out["meta"]["output_script"], "latin")
        self.assertEqual(item["text"], "to mere saath nikla aap par comment kijiye,")
        self.assertIsNone(re.search(r"[\u0900-\u097F]", json.dumps(out, ensure_ascii=False)))

    def test_single_keys_karaoke_branch_present(self):
        source = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn("var appliedKaraoke = false;", source)
        self.assertIn(
            "if (sourceTextProp && preset && preset.karaokeEnabled) {",
            source,
        )
        self.assertIn(
            "sourceTextProp.setValueAtTime(start, _makeStyledDocument(sourceTextProp, textValue, preset, null, preparedItem.wordRuleHighlights));",
            source,
        )
        self.assertIn("appliedKaraoke = true;", source)

    def test_layout_has_vertical_safe_width_logic(self):
        source = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn("function _resolveEffectiveMaxTextWidth", source)
        self.assertIn("function _enumerateLineLayouts", source)
        self.assertIn("function _getBalancedLineRange(words, preset)", source)
        self.assertIn("function _lineLayoutPenalty(lines, totalWords, preferredLines)", source)
        self.assertIn("penalty += 1500000;", source)
        self.assertIn("var layoutPenalty = _lineLayoutPenalty(lines, words.length, preferredLines);", source)
        self.assertIn("preferredLines = 3", source)
        self.assertIn("columnPenalty", source)
        self.assertIn('_removeLayersByPrefix(comp, "AEAS__LAYERS_MEASURE");', source)
        self.assertIn("try { layer.locked = false; } catch (_unlockErr) {}", source)
        self.assertIn("try { measureLayer.locked = false; } catch (_measureUnlockErr) {}", source)

    def test_subtitle_timings_are_clamped_to_avoid_layer_overlaps(self):
        sys.path.insert(0, str(ROOT))
        from backend.postprocess import postprocess_subtitles

        raw = {
            "items": [
                {"start": 0.0, "end": 2.5, "text": "first phrase"},
                {"start": 1.5, "end": 3.0, "text": "second phrase"},
                {"start": 2.4, "end": 4.0, "text": "third phrase"},
            ]
        }
        out = postprocess_subtitles(raw, min_dur=0.05, max_dur=4.5)
        items = out["items"]
        self.assertEqual(len(items), 3)
        for current, nxt in zip(items, items[1:]):
            self.assertLessEqual(current["end"], nxt["start"])
            self.assertGreater(current["end"], current["start"])

        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn("function _getNextSubtitleStart(items, index, fallback)", jsx)
        self.assertIn("function _buildVisualTimingWordsForChunks(item, words)", jsx)
        self.assertIn("function _visualTimingWeightForWord(word)", jsx)
        self.assertIn("function _normalizeChunkTimingWords(item, words)", jsx)
        self.assertIn("preset.redistributeChunkTimings === true", jsx)
        self.assertIn("baseWords = _normalizeChunkTimingWords(item, baseWords);", jsx)
        self.assertIn("itemStart + (duration * consumedWeight / totalWeight)", jsx)
        self.assertIn("function _stabilizeExpandedItemTimings(items, comp)", jsx)
        self.assertIn("var sameBaseGapBridge = Math.max(0.22, frame * 6);", jsx)
        self.assertIn("preset.aeMaxWordsPerLayer", jsx)
        self.assertIn("preset.aeMaxSecondsPerLayer", jsx)
        self.assertIn("forceAeSafetyChunk", jsx)
        self.assertIn("prepared.aeSafetySplit = true;", jsx)
        self.assertIn('layers:item_fit"', jsx)
        self.assertIn('layers:item_done"', jsx)
        self.assertIn("return !!expectedIds[key];", jsx)
        self.assertIn("var sameBase = _timingBaseId(item) && _timingBaseId(item) === _timingBaseId(next);", jsx)
        self.assertIn("end = Math.max(start + frame, nextStart - frame);", jsx)
        self.assertIn("_stabilizeExpandedItemTimings(_expandItemsForPreset(subtitles.items || [], preset), comp)", jsx)
        self.assertIn("end = Math.max(start + 0.01, nextStart - frameGap);", jsx)
        self.assertIn("renderItem.start = start;", jsx)
        self.assertIn("renderItem.end = end;", jsx)

    def test_comp_mix_render_uses_display_start_time(self):
        source = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        self.assertIn("comp.displayStartTime", source)
        self.assertNotIn("item.timeSpanStart=0;", source)

    def test_preview_layout_uses_measured_width(self):
        source = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        self.assertIn("function getPreviewMeasureContext()", source)
        self.assertIn("function measurePreviewLineWidth(words, fontInfo, preset, fontSize, strokeWidth)", source)
        self.assertIn("function enumeratePreviewWordLayouts(words, lineCount)", source)
        self.assertIn("function getPreviewLineLayoutPenalty(layout, totalWords, preferredLines)", source)
        self.assertIn("var layoutPenalty = getPreviewLineLayoutPenalty(layout, words.length, preferredLines);", source)
        self.assertIn("(overflow * 1000) +", source)
        self.assertNotIn("(overflow * 100000) +", source)
        self.assertIn("var layout = buildPreviewTextLayout(sampleText, preset, fontInfo, fontSize, strokeWidth, {", source)
        self.assertIn("var fontSize = Math.max(1, Math.round((Number(preset.fontSize) || 60) * previewScale));", source)
        self.assertIn("minFontSize: Math.max(1, Math.round(fontSize * 0.78))", source)
        self.assertNotIn("minFontSize: Math.max(12, Math.round(fontSize * 0.78))", source)
        self.assertIn("return words.slice(0, visualLimit).join(\" \");", source)
        self.assertIn("function updateLayoutPreview(quote, preset, fontInfo)", source)
        self.assertIn("function getLayoutPreviewCaptionMaxWidth(preset, previewScale)", source)
        self.assertIn("function getPreviewCompDimensions()", source)
        self.assertIn("function getPreviewDesignScaleForComp()", source)
        self.assertIn("function syncLayoutPreviewStageAspect()", source)
        self.assertIn("layoutPreviewStageEl.style.aspectRatio", source)
        self.assertIn("compWidth:Number(comp.width)||0,compHeight:Number(comp.height)||0", source)
        self.assertIn("activeCompWidth = Number(parsed.compWidth || 0)", source)
        self.assertIn("[blockWidthControlEl, \"maxTextWidth\", \"number\"]", source)
        self.assertIn("[maxLinesControlEl, \"maxLines\", \"number\"]", source)
        self.assertIn("[blockScaleControlEl, \"blockScale\", \"number\"]", source)
        self.assertIn("[marginXControlEl, \"positionOffsetX\", \"number\"]", source)
        self.assertIn("[marginYControlEl, \"marginY\", \"number\"]", source)
        self.assertIn("preset.maxTextWidth = coerceNumberOverride", source)
        self.assertIn("preset.maxLines = Math.max(1, Math.min(4, Math.round(coerceNumberOverride", source)
        self.assertIn("preset.blockScale = coerceNumberOverride", source)
        self.assertIn("scale(\" + blockScale.toFixed(3) + \")", source)
        self.assertIn("function setPreviewStyleControl(el, overrideKey, value)", source)
        self.assertIn('previewDragState.mode === "width"', source)
        self.assertIn('previewDragState.mode === "scale"', source)
        self.assertIn('previewDragState.mode === "padding"', source)
        self.assertIn("startScaleDistance", source)
        self.assertIn("function getPreviewBalancedLineRange(words, preset)", source)
        self.assertIn("var hardMaxLines = Math.max(1, Math.min(4, Math.round(Number(preset && preset.maxLines) || getMaxLinesControlValue())));", source)
        self.assertIn("var maxLines = Math.min(hardMaxLines, wordCount);", source)
        self.assertIn("columnPenalty", source)
        self.assertIn("tallPenalty", source)
        self.assertNotIn("var wordGapWidth =", source)
        self.assertIn("function buildPreviewWordPairLines(words)", source)
        self.assertIn("preset.chunkWordsEnabled || preset.forceTwoLines", source)
        self.assertIn("buildLayoutPreviewSampleText(quote, maxChars, preset)", source)
        self.assertIn("function pickStressPreviewQuote()", source)
        self.assertIn("var visualLimit = getVisualChunkWordLimit(getMaxLinesControlValue());", source)
        self.assertIn('lastPreviewQuoteSource = "review caption";', source)
        self.assertIn("layout[k].length === 1 && words.length >= 4", source)
        self.assertIn("layoutPreviewCaptionEl.style.top = \"50%\";", source)
        self.assertIn("function bindPreviewDrag()", source)
        self.assertIn('layoutPreviewStageEl.addEventListener("pointerdown"', source)
        self.assertIn('layoutPreviewStageEl.addEventListener("mousedown"', source)
        self.assertIn('layoutPreviewStageEl.addEventListener("touchstart"', source)
        self.assertIn("layoutPreviewStageEl.setPointerCapture(pointerId)", source)
        self.assertIn("var previewScale = getLayoutPreviewScale();", source)
        self.assertIn("scaleX: dims.width / Math.max(1, stageRect.width)", source)
        self.assertIn("translate(-50%, -50%) translate(", source)
        self.assertIn("window.AEAS_TEST_HOOKS", source)
        self.assertIn("data-aeas-preview-result", source)
        self.assertNotIn("joined.length > 30 || words.length > 4", source)

        css = (ROOT / "panel" / "style.css").read_text(encoding="utf-8")
        self.assertIn("white-space: nowrap;", css)

    def test_ae_layout_uses_balanced_box_line_range(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn("function _getBalancedLineRange(words, preset)", jsx)
        self.assertIn("var hardMaxLines = Math.max(1, Math.min(4, Math.round(_toNumber(preset && preset.maxLines, 2))));", jsx)
        self.assertIn("var maxLines = Math.min(hardMaxLines, wordCount);", jsx)
        self.assertIn("var lineRange = _getBalancedLineRange(words, preset);", jsx)
        self.assertIn("columnPenalty", jsx)
        self.assertIn("tallPenalty", jsx)

    def test_preview_and_ae_use_center_offset_y(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        self.assertIn("Offset Y", panel_html)
        self.assertIn("Offset X", panel_html)
        self.assertIn("Max Lines", panel_html)
        self.assertIn("Block Width", panel_html)
        self.assertIn("Block Scale", panel_html)
        self.assertIn('data-unit=" signed-px"', panel_html)
        self.assertIn("var offsetPreviewPx = Math.round((offsetY / dims.height) * stageHeight);", panel_js)
        self.assertIn("var offsetPreviewXPx = Math.round((offsetX / dims.width) * stageWidth);", panel_js)
        self.assertIn("positionOffsetX", panel_js)
        self.assertIn("payload.verticalMarginY = offsetY;", panel_js)
        self.assertIn("function _resolveOffsetY(comp, preset)", jsx)
        self.assertIn("function _resolveSubtitleBaseX(comp, preset)", jsx)
        self.assertIn("preset.maxTextWidth = Number(overrides.maxTextWidth);", jsx)
        self.assertIn("preset.maxLines = Math.max(1, Math.min(4, Math.round(Number(overrides.maxLines))));", jsx)
        self.assertIn("preset.blockScale = _clamp(Number(overrides.blockScale), 40, 180);", jsx)
        self.assertIn("preset.verticalMarginY = Number(overrides.verticalMarginY);", jsx)
        self.assertIn("function _getBlockScalePercent(preset)", jsx)
        self.assertIn("_combineBlockScale(preset, scaleFrom)", jsx)
        self.assertIn("var y = (Number(comp.height) / 2) + offsetY;", jsx)

    def test_run_does_not_force_open_render_comp_viewer(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        self.assertIn("function _focusTargetCompViewer(comp)", jsx)
        self.assertNotIn("_focusTargetCompViewer(comp);", jsx)
        self.assertNotIn("comp.time = firstSubtitleLayer.inPoint;", jsx)
        self.assertNotIn("comp.time = Math.max(0, _toNumber(items[0].start, 0));", jsx)
        self.assertIn("try{ if(comp && comp.openInViewer){ comp.openInViewer(); } }catch(_focusErr){}", panel_js)
        self.assertIn("var comp = resolveTargetComp(target || \"active_comp\", targetCompName || \"\", targetCompId || \"\");", jsx)
        self.assertIn('id="runOverlayText"', panel_html)
        self.assertIn("var runOverlayTextEl = document.getElementById(\"runOverlayText\");", panel_js)
        self.assertIn("function waitForUiPaint()", panel_js)
        self.assertIn("await waitForUiPaint();", panel_js)

    def test_default_stt_model_is_whisper_turbo(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        backend = (ROOT / "backend" / "transcribe.py").read_text(encoding="utf-8")
        self.assertIn('getValue("model") || "turbo"', panel_js)
        self.assertIn('<select id="model">', panel_html)
        self.assertIn('<option value="turbo" selected>Whisper Turbo: default</option>', panel_html)
        self.assertIn('<option value="small">Small: fast local</option>', panel_html)
        self.assertIn('<option value="medium">Medium: better accents</option>', panel_html)
        self.assertIn('<option value="large-v3">Large v3: most accurate</option>', panel_html)
        self.assertIn('model_name: str = "turbo"', backend)
        self.assertIn('parser.add_argument("--model", default="turbo"', backend)

    def test_transcription_defaults_are_less_likely_to_drop_speech(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        backend = (ROOT / "backend" / "transcribe.py").read_text(encoding="utf-8")
        self.assertIn("vad_filter: bool = False", backend)
        self.assertIn("vad_filter=vad_filter", backend)
        self.assertIn('"--vad_filter"', backend)
        self.assertIn('"--beam_size", "5"', panel_js)
        self.assertIn('"--best_of", "5"', panel_js)
        self.assertIn('"--no_speech_threshold", "0.85"', panel_js)
        self.assertIn('"--chunk_seconds", "15"', panel_js)
        self.assertIn('"--chunk_overlap", "1.5"', panel_js)
        self.assertIn('"--clip_pad", "0.8"', panel_js)
        self.assertIn("MIN_SOURCE_ITEMS_BEFORE_COMP_MIX_RETRY = 12", panel_js)
        self.assertIn("retrying active comp mix for missing phrases", panel_js)
        self.assertIn('"--clip_pad"', backend)
        self.assertIn('"--no_speech_threshold"', backend)
        self.assertIn('"--chunk_seconds"', backend)
        self.assertIn('"--chunk_overlap"', backend)
        self.assertIn("clip_timestamps=[round(cursor, 3), round(end, 3)]", backend)

    def test_backend_emits_structured_progress_for_panel(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        backend = (ROOT / "backend" / "transcribe.py").read_text(encoding="utf-8")
        self.assertIn("def emit_progress(percent: int, message: str) -> None:", backend)
        self.assertIn('print(f"AEAS_PROGRESS {percent} {message}", flush=True)', backend)
        self.assertIn("var tagged = l.match(/^AEAS_PROGRESS", panel_js)

    def test_ae_evalscript_calls_have_watchdog_timeouts(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        self.assertIn("function evalScript(script, options)", panel_js)
        self.assertIn("var timeoutMs = Math.max(1000, Number(options.timeoutMs || 45000));", panel_js)
        self.assertIn("did not respond after", panel_js)
        self.assertIn("After Effects is likely busy or stuck", panel_js)
        self.assertIn('evalScript(buildFontListScript(), { timeoutMs: 12000, label: "AE font list" })', panel_js)
        self.assertIn('evalScript(buildScanSourcesScript(), { timeoutMs: 15000, label: "AE timeline scan" })', panel_js)
        self.assertIn('evalScript(jsx, { timeoutMs: 900000, label: "AE active comp audio render" })', panel_js)
        self.assertIn('var applyStatusPath = repoRoot + "/tmp/apply_status.json";', panel_js)
        self.assertIn("$.global.AEAS_APPLY_STATUS_PATH", panel_js)
        self.assertIn('evalScript(code, { timeoutMs: 120000, label: "AE subtitle apply" })', panel_js)
        self.assertIn("function readApplyStatusPayload(applyStatusPath)", panel_js)
        self.assertIn('status.stage === "done"', panel_js)
        self.assertIn('return String(status.detail);', panel_js)
        self.assertIn("Last AE stage:", panel_js)
        self.assertIn("function _writeApplyStatus(stage, detail)", (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8"))

    def test_transcript_review_and_exports_are_present(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        style_css = (ROOT / "panel" / "style.css").read_text(encoding="utf-8")
        self.assertIn("Review Captions", panel_html)
        self.assertIn("Reference Text", panel_html)
        self.assertIn('id="referenceText"', panel_html)
        self.assertIn('id="referenceTextMeta"', panel_html)
        self.assertIn("Word Rules", panel_html)
        self.assertIn('id="wordRulesList"', panel_html)
        self.assertIn('id="btnAddWordRule"', panel_html)
        self.assertIn('id="btnCopyCaptions"', panel_html)
        self.assertIn('id="btnExportSrt"', panel_html)
        self.assertIn('id="btnExportVtt"', panel_html)
        self.assertNotIn("This breakup did not happen for no reason.", panel_html)
        self.assertNotIn("Let me tell you what was really going on.", panel_html)
        self.assertIn("Current audio has not been transcribed yet.", panel_html)
        self.assertIn("function renderTranscriptReview()", panel_js)
        self.assertIn("var transcriptReviewHasFreshPayload = false;", panel_js)
        self.assertIn("if (!transcriptReviewHasFreshPayload) {", panel_js)
        self.assertIn("transcriptReviewListEl.innerHTML = \"\";", panel_js)
        self.assertIn("function annotateCurrentSubtitlesTranscriptionModel()", panel_js)
        self.assertIn("payload.meta.sttModel = getSelectedModelValue();", panel_js)
        self.assertIn("payload.meta.sttModelLabel = getSelectedModelLabel();", panel_js)
        self.assertIn("Model: \" + modelLabel + modelStaleNote + \".", panel_js)
        self.assertIn("selected now: \" + selected + \"; Retiming needed", panel_js)
        self.assertIn("live_status \" + APP_VERSION + \" | \" + prefix + \" | model \" + getSelectedModelValue()", panel_js)
        self.assertIn("function buildTranscriptReviewCopyText()", panel_js)
        self.assertIn("function copyTranscriptReviewToClipboard()", panel_js)
        self.assertIn('bind("btnCopyCaptions", copyTranscriptReviewToClipboard);', panel_js)
        self.assertIn('id="btnApplyChangedCaptions"', panel_html)
        self.assertIn("Apply Changed", panel_html)
        self.assertIn("function normalizeCaptionDiffText(value)", panel_js)
        self.assertIn("function isReferenceChangedCaptionItem(item)", panel_js)
        self.assertIn("function buildReferenceChangedPatchPayload(payload)", panel_js)
        self.assertIn("function buildAndWriteReferenceChangedPatch()", panel_js)
        self.assertIn("captionPatchMode = \"reference_changed_only\"", panel_js)
        self.assertIn('"patch_changed"', panel_js)
        self.assertIn("async function handleApplyChangedCaptions()", panel_js)
        self.assertIn('bind("btnApplyChangedCaptions", handleApplyChangedCaptions);', panel_js)
        self.assertIn('lines.join("\\n")', panel_js)
        self.assertIn("Generate captions before copying spoken text.", panel_js)
        self.assertIn("Transcribe current audio before copying captions.", panel_js)
        self.assertIn("Transcribe current audio before exporting", panel_js)
        self.assertIn("function buildSubtitleExport(format)", panel_js)
        self.assertIn("var activeCompDisplayStartTime = 0;", panel_js)
        self.assertIn("compDisplayStartTime:displayStart", panel_js)
        self.assertIn("function getPayloadDisplayStartTime(payload)", panel_js)
        self.assertIn("function formatCaptionDisplayTime(seconds, includeHours, payload)", panel_js)
        self.assertIn("applyCompDisplayStartMeta(payload);", panel_js)
        self.assertIn("function normalizeSubtitlePayloadTimeline(payload)", panel_js)
        self.assertIn("function shiftSubtitlePayloadTiming(payload, offset)", panel_js)
        self.assertIn("function splitOversizedCaptionItems(payload)", panel_js)
        self.assertIn("function stampCaptionDocumentPayload(payload)", panel_js)
        self.assertIn("function prepareCaptionDocumentPayload(payload)", panel_js)
        self.assertIn("function prepareSubtitlesForApply(subtitlesPath)", panel_js)
        self.assertIn("function prepareCurrentSubtitlesForApply()", panel_js)
        self.assertIn("payload.meta.timelineNormalizedToZero = true;", panel_js)
        self.assertIn("payload.meta.timelineNormalizationOffset", panel_js)
        self.assertIn("payload.meta.captionDocumentSourceOfTruth", panel_js)
        self.assertIn("payload.meta.captionLayout", panel_js)
        self.assertIn("normalizeSubtitlePayloadTimeline(payload);", panel_js)

    def test_native_qa_runner_is_wired(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        style_css = (ROOT / "panel" / "style.css").read_text(encoding="utf-8")
        native_qa = (ROOT / "scripts" / "native_qa.py").read_text(encoding="utf-8")

        self.assertIn('id="btnNativeQa"', panel_html)
        self.assertIn("Native QA", panel_html)
        self.assertIn(".status-actions", style_css)
        self.assertIn("#btnNativeQa", style_css)
        self.assertIn("function runRepoPythonScript(scriptRelativePath, args, onProgress)", panel_js)
        self.assertIn("function runRepoPythonScriptViaAeSystem(scriptRelativePath, args, onProgress)", panel_js)
        self.assertIn('async function handleNativeQa()', panel_js)
        self.assertIn('runRepoPythonScript("scripts/native_qa.py", [], updateRunProgress)', panel_js)
        self.assertIn('bind("btnNativeQa", handleNativeQa);', panel_js)
        self.assertIn("def resolve_repo_root(script_path: Path) -> Path:", native_qa)
        self.assertIn('Path("/Users/airliner/ae-auto-subtitles")', native_qa)
        self.assertIn("REPORT_PATH = ROOT / \"tmp\" / \"native_qa_report.json\"", native_qa)
        self.assertIn("[sys.executable, \"scripts/verify_ae_layout.py\"]", native_qa)
        self.assertIn("[sys.executable, \"scripts/verify_ae_timing.py\"]", native_qa)
        self.assertIn("\"preview_overflow_matches_ae\"", native_qa)
        self.assertIn("splitOversizedCaptionItems(payload);", panel_js)
        self.assertIn("prepareSubtitlesForApply(subtitlesPath);", panel_js)
        self.assertIn("writeCurrentSubtitlesTimingMeta();", panel_js)
        self.assertIn("payload.meta.reviewTimeMode", panel_js)
        self.assertIn("formatCaptionDisplayTime(item.start, false, payload)", panel_js)
        self.assertIn("formatCaptionDisplayTime(item.start, true, payload)", panel_js)
        self.assertIn("function applyReferenceTextToPayload(payload, referenceText)", panel_js)
        self.assertIn("function applyReferenceTextToCurrentSubtitles()", panel_js)
        self.assertIn("function alignReferenceTokensToSource(sourceSlots, referenceTokens)", panel_js)
        self.assertIn("function referenceTokenSimilarity(sourceToken, referenceToken)", panel_js)
        self.assertIn("function buildReferenceAlignedAssignments(items, referenceTokens)", panel_js)
        self.assertIn("function makeReferenceGapCaption(tokens, start, end, reason)", panel_js)
        self.assertIn("function makeReferenceTimedCaption(entries, start, end, reason)", panel_js)
        self.assertIn("function splitReferenceAssignmentChunks(entries, item, maxChars, maxLines)", panel_js)
        self.assertIn("function rebalanceOversizedReferenceAssignments(items, assignments, syntheticItems)", panel_js)
        self.assertIn("function absorbShortReferenceGapCaptions(items)", panel_js)
        self.assertIn("function mergeTinyReferenceCaptions(items)", panel_js)
        self.assertIn("function splitOversizedReferenceItems(items)", panel_js)
        self.assertIn("function shouldMergeTinyReferenceCaption(item)", panel_js)
        self.assertIn("wordsPerSecond > 5.2", panel_js)
        self.assertIn("charsPerSecond > 28", panel_js)
        self.assertIn("while (items.length > 1 && safety < 80)", panel_js)
        self.assertIn("function mergeReferenceTextIntoItem(target, gapItem, prepend)", panel_js)
        self.assertIn("function ensureUniqueCaptionIds(payload)", panel_js)
        self.assertIn("payload.meta.uniqueCaptionIdsRepaired = changed;", panel_js)
        self.assertIn("ensureUniqueCaptionIds(payload);", panel_js)
        self.assertIn("prevTimed && nextTimed && nextTimed.start > prevTimed.end + 0.02", panel_js)
        self.assertIn("var localStep = (nextTimed.start - prevTimed.end) / missingBetween;", panel_js)
        self.assertIn("referenceTextSynthetic", panel_js)
        self.assertIn("referenceTextAbsorbedGap", panel_js)
        self.assertIn('payload.meta.referenceTextAlignment = "word_similarity+missing_gap_fill";', panel_js)
        self.assertIn("payload.meta.referenceTextAbsorbedGapCaptions", panel_js)
        self.assertIn("payload.meta.referenceTextOverflowSplitCaptions", panel_js)
        self.assertIn("payload.meta.referenceTextCadenceMergedCaptions", panel_js)
        self.assertIn("payload.meta.referenceTextFinalSafetySplitCaptions", panel_js)
        self.assertIn("reference_final_safety_split", panel_js)
        self.assertIn("payload.meta.referenceTextSyntheticItems", panel_js)
        self.assertIn("Missing Whisper gaps are filled from reference text.", panel_js)
        self.assertNotIn("var refCursor = 0;", panel_js)
        self.assertIn("function applyWordRulesToPayload(payload)", panel_js)
        self.assertIn("function findRuleHighlightsInText(text, rules)", panel_js)
        self.assertIn("function buildCaptionReviewHtml(text, highlights)", panel_js)
        self.assertIn("function saveCaptionReviewEdit(index, text)", panel_js)
        self.assertIn("function moveCaptionReviewText(index, direction, selectedText)", panel_js)
        self.assertIn("function getSelectedTextInside(element)", panel_js)
        self.assertIn("text.contentEditable = \"true\";", panel_js)
        self.assertIn("Move selected text, or the first word, to previous caption", panel_js)
        self.assertIn("Move selected text, or the last word, to next caption", panel_js)
        self.assertIn("wordRuleHighlights", panel_js)
        self.assertIn("referenceTextApplied", panel_js)
        self.assertIn("referenceTextSource", panel_js)
        self.assertIn("function getCaptionReviewSource(item)", panel_js)
        self.assertIn("caption-row-source", panel_js)
        self.assertNotIn("payload.items.slice(0, 8)", panel_js)
        self.assertIn("payload.items.slice() : []", panel_js)
        self.assertIn("missing_whisper_gap", panel_js)
        self.assertIn("formatCaptionDisplayTime(item.start, true, payload).replace", panel_js)
        self.assertIn(".caption-row.active", style_css)
        self.assertIn("max-height: min(58vh, 620px);", style_css)
        self.assertIn("overflow-y: auto;", style_css)
        self.assertIn(".reference-text-panel", style_css)
        self.assertIn(".word-rules-panel", style_css)
        self.assertIn(".caption-word-highlight", style_css)
        self.assertIn(".caption-row-source", style_css)
        self.assertIn(".caption-row-actions", style_css)
        self.assertIn(".caption-row-shift", style_css)
        self.assertIn(".caption-row-text", style_css)
        self.assertIn("user-select: text;", style_css)
        self.assertIn(".caption-row-time", style_css)
        self.assertIn("user-select: none;", style_css)
        self.assertIn('text.title = "Edit spoken text, then blur or press Enter to save";', panel_js)
        self.assertIn("white-space: nowrap;", style_css)

    def test_default_preset_is_bold_yellow_highlight(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        self.assertIn('var DEFAULT_PRESET_NAME = "bold_yellow_shadow";', panel_js)
        self.assertIn('<option value="bold_yellow_shadow" selected>Bold: Yellow highlight</option>', panel_html)
        self.assertIn("var STANDARD_READABILITY_DEFAULTS = {", panel_js)
        self.assertIn("fontSize: 48", panel_js)
        self.assertIn("strokeWidth: 0", panel_js)
        self.assertIn("maxLines: 2", panel_js)
        self.assertIn("maxTextWidth: 900", panel_js)
        self.assertIn("blockScale: 91", panel_js)
        self.assertIn("verticalMarginY: 224", panel_js)
        self.assertIn("applyStandardReadabilityDefaults(deepClone(map[key]))", panel_js)
        self.assertIn('id="fontSizeControl" class="slider-input" type="range" min="12" max="240" step="1" value="48"', panel_html)
        self.assertIn('id="maxLinesControl" class="slider-input" type="range" min="1" max="4" step="1" value="2"', panel_html)
        self.assertIn('id="strokeWidthControl" class="slider-input" type="range" min="0" max="24" step="1" value="0"', panel_html)
        self.assertIn('id="blockWidthControl" class="slider-input" type="range" min="180" max="900" step="10" value="900"', panel_html)
        self.assertIn('id="blockScaleControl" class="slider-input" type="range" min="40" max="180" step="1" value="91"', panel_html)
        self.assertIn('id="marginY" class="slider-input" type="range" min="-720" max="720" step="2" value="224"', panel_html)

    def test_version_is_declared_consistently(self):
        version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        manifest = (ROOT / "panel" / "CSXS" / "manifest.xml").read_text(encoding="utf-8")
        self.assertRegex(version, r"^1\.0\.\d+$")
        self.assertIn(f'var APP_VERSION = "{version}";', panel_js)
        self.assertRegex(panel_html, rf'id="summaryVersion"[^>]*>{re.escape(version)}<')
        self.assertIn(f'live_status {version} | ok | model turbo | idle', panel_html)
        self.assertIn(f'ExtensionBundleVersion="{version}"', manifest)
        self.assertIn(f'Version="{version}"', manifest)

    def test_picker_buttons_have_click_wait_feedback(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        style_css = (ROOT / "panel" / "style.css").read_text(encoding="utf-8")
        self.assertIn("function pulsePickerButton(buttonEl, options)", panel_js)
        self.assertIn("pulsePickerButton(fontPickerButtonEl", panel_js)
        self.assertIn("pulsePickerButton(presetPickerButtonEl", panel_js)
        self.assertIn("pulsePickerButton(outputModePickerButtonEl", panel_js)
        self.assertIn("pulsePickerButton(languagePickerButtonEl", panel_js)
        self.assertIn("var fontCatalogVerifiedThisSession = false;", panel_js)
        self.assertIn("if (isOpen && (isFontCatalogLoading || !fontCatalogReady || !fontCatalogVerifiedThisSession)) {", panel_js)
        self.assertIn("var needsFontLoadWindow = shouldOpen && (!fontCatalogReady || !fontCatalogVerifiedThisSession || isFontCatalogLoading);", panel_js)
        self.assertIn("setFontPickerLoading(true, fontPickerPreviewEl && fontPickerPreviewEl.dataset.loadingMessage || \"Loading fonts from AE...\");", panel_js)
        self.assertIn("if (isFontCatalogLoading && (!fontCatalogReady || !fontCatalogVerifiedThisSession)) {", panel_js)
        self.assertIn("ensureFontsLoaded({ forceRefresh: !fontCatalogVerifiedThisSession, showMenuLoading: true })", panel_js)
        self.assertIn("fontCatalogRequestStarted = false;", panel_js)
        self.assertIn(".font-picker-button.is-pressing", style_css)
        self.assertIn(".font-picker-button.is-opening::after", style_css)
        self.assertIn("animation: aeasFontSpinner", style_css)

    def test_font_picker_has_inline_loading_state(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        style_css = (ROOT / "panel" / "style.css").read_text(encoding="utf-8")
        self.assertIn("function renderFontPickerLoadingState(message)", panel_js)
        self.assertIn('fontPickerButtonEl.addEventListener("click"', panel_js)
        self.assertIn("function positionFloatingPickerMenu(buttonEl, menuEl)", panel_js)
        self.assertIn("function repositionOpenPickerMenus()", panel_js)
        self.assertIn("positionFloatingPickerMenu(fontPickerButtonEl, fontPickerMenuEl);", panel_js)
        self.assertIn('window.addEventListener("resize", repositionOpenPickerMenus);', panel_js)
        self.assertIn("Fonts are loading", panel_js)
        self.assertIn(".font-picker-loading", style_css)
        self.assertIn(".font-picker-menu.floating-picker-menu", style_css)
        self.assertIn("position: fixed;", style_css)
        self.assertIn("@keyframes aeasFontLoaderSweep", style_css)

    def test_preview_uses_transcript_or_neutral_spoken_samples(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        self.assertIn("function readTranscriptPreviewSamples()", panel_js)
        self.assertIn('lastPreviewQuoteSource = "last transcript";', panel_js)
        self.assertIn('lastPreviewQuoteSource = "sample line";', panel_js)
        self.assertIn("function getPreviewFallbackQuotesForLanguage(languageValue)", panel_js)
        self.assertNotIn("This is a classic karaoke caption", panel_js)
        self.assertNotIn("This is a classic caption", panel_js)

    def test_comp_mix_is_explicit_source_not_hidden_priority(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        self.assertIn("Active comp mix -> all audible audio in comp", panel_js)
        self.assertIn("function useCompMixSelection()", panel_js)
        self.assertIn("function shouldRenderCompMixFirst(selectedSources)", panel_js)
        self.assertIn("var compMixSelectionWasManual = false;", panel_js)
        self.assertIn("if (compMixSelectionWasManual) {", panel_js)
        self.assertIn("if (activeCompHasNonFileAudio) {", panel_js)
        self.assertIn("var defaultUseCompMix = !!activeCompMixAvailable;", panel_js)
        self.assertIn("mixCb.checked = defaultUseCompMix;", panel_js)
        self.assertIn("cb.checked = true;", panel_js)
        self.assertIn("Auto-selected all file-backed sources.", panel_js)
        self.assertIn("By default all file-backed layers are selected.", (ROOT / "panel" / "index.html").read_text(encoding="utf-8"))
        self.assertNotIn("Auto-selected longest 2.", panel_js)
        self.assertNotIn("cb.checked = i < 2;", panel_js)
        self.assertIn("Fast path: transcribing selected audio sources first; comp mix remains fallback.", panel_js)
        self.assertIn("activeCompHasNonFileAudio &&\n      !useCompMix &&", panel_js)
        self.assertNotIn("run will prioritize comp mix", panel_js)
        self.assertIn("nested/precomp audio layer(s), so Active comp mix can be used to catch voice inside the comp.", panel_js)
        self.assertIn("The spoken voice is likely inside nested/precomp audio. Enable Active comp mix and run again.", panel_js)
        self.assertNotIn("scanSourcesFromAe({ autoStart: true })", panel_js)
        self.assertIn("async function startStartupBackgroundTranscription(label, showStatus)", panel_js)
        self.assertIn("function scheduleStartupBackgroundTranscription()", panel_js)
        self.assertIn("function handleScanSources()", panel_js)
        self.assertIn('"Background: preparing fast audio sources for Whisper..."', panel_js)
        self.assertIn("Background Whisper not started yet: open the target composition", panel_js)
        self.assertIn('bind("btnScanSources", handleScanSources);', panel_js)
        self.assertIn('bind("btnRefreshTimings", handleTranscribe);', panel_js)

    def test_scan_sources_reads_footage_file_paths_from_multiple_ae_sources(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        self.assertIn("function pathFromSource(src)", panel_js)
        self.assertIn("src.file", panel_js)
        self.assertIn("src.mainSource&&src.mainSource.file", panel_js)
        self.assertIn("src.proxySource&&src.proxySource.file", panel_js)
        self.assertIn("skippedSources:skipped", panel_js)
        self.assertIn("source has no readable file path", panel_js)
        self.assertIn("audio disabled", panel_js)
        self.assertIn("layer disabled", panel_js)

    def test_visible_presets_force_box_off_in_panel_and_ae(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        style_css = (ROOT / "panel" / "style.css").read_text(encoding="utf-8")
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn("var BOX_DISABLED_PRESET_NAMES = {", panel_js)
        self.assertIn("function disableBoxFeaturesForVisiblePreset(preset)", panel_js)
        self.assertIn("payload.boxEnabled = false;", panel_js)
        self.assertIn("payload.wordBoxEnabled = false;", panel_js)
        self.assertIn('activeStyleColorToken === "boxColor"', panel_js)
        self.assertNotIn('buildStyleToken("Box", boxHex, { kind: "box", alpha: 0.12', panel_js)
        self.assertIn("function _disableBoxFeaturesForPreset(preset)", jsx)
        self.assertIn("_disableBoxFeaturesForPreset(preset);", jsx)
        self.assertIn("function _setLayerPositionInCompSpace(layer, point)", jsx)
        self.assertIn("function _getLayerPositionInCompSpace(layer)", jsx)
        self.assertIn("function ensureSubtitlesPositionControl(comp, preset)", jsx)
        self.assertIn('control.name = "Position";', jsx)
        self.assertIn("_resolvePositionControlPoint(comp, preset || {})", jsx)
        self.assertIn("function _shouldAutoParentSubtitles(preset)", jsx)
        self.assertIn("preset.autoParentToPosition === true", jsx)
        self.assertIn("function parentSubtitleLayersToPositionControl(comp, preset)", jsx)
        self.assertIn("if (!_shouldAutoParentSubtitles(preset))", jsx)
        self.assertIn("function _parentLayerToPositionControlBeforeLayout(layer, comp, preset)", jsx)
        self.assertIn("_parentLayerToPositionControlBeforeLayout(textLayer, comp, preset);", jsx)
        self.assertIn("_parentLayerToPositionControlBeforeLayout(lineLayer, comp, preset);", jsx)
        self.assertIn("_parentLayerToPositionControlBeforeLayout(overlayLayer, comp, preset);", jsx)
        self.assertIn("var worldPosition = _getLayerPositionInCompSpace(layer);", jsx)
        self.assertIn("_setLayerPositionInCompSpace(layer, worldPosition);", jsx)
        self.assertIn("Do not auto-parent subtitle layers to Position unless the preset opts in.", jsx)
        self.assertNotIn("_parentLayerPreservingWorldTransform(layer, control);", jsx)
        self.assertIn("ensureSubtitlesPositionControl(comp, preset);", jsx)
        self.assertIn("parentSubtitleLayersToPositionControl(comp, preset);", jsx)
        self.assertIn('position_control_skip", "auto parent disabled', jsx)
        self.assertIn('parent_skip", "auto parent disabled', jsx)
        self.assertIn('resultMessage += ", control=Position";', jsx)
        self.assertIn("if (thisLayer.parent) { p=thisLayer.parent.fromComp(p); }", jsx)
        self.assertIn("preset.verticalMarginY !== undefined", jsx)
        self.assertIn("box-control-temporarily-hidden", panel_html)
        self.assertIn(".box-control-temporarily-hidden", style_css)

    def test_run_queues_current_style_snapshot_while_background_whisper_runs(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        self.assertIn("var backgroundTranscribePromise = null;", panel_js)
        self.assertIn("var backgroundTranscribeState = \"idle\";", panel_js)
        self.assertIn("var startupBackgroundAttempt = 0;", panel_js)
        self.assertIn("function getCreateSettingsSnapshot()", panel_js)
        self.assertIn("styleOverrides: JSON.stringify(getStyleOverridesPayload())", panel_js)
        self.assertIn("async function applySubtitlesWithSnapshot(snapshot, label)", panel_js)
        self.assertIn("if (backgroundTranscribeState === \"running\" && backgroundTranscribePromise)", panel_js)
        self.assertIn("Run queued with current style settings. Waiting for background Whisper to finish...", panel_js)
        self.assertIn("await backgroundTranscribePromise;", panel_js)
        self.assertIn("await applySubtitlesWithSnapshot(snapshot, \"Applying queued subtitles...\");", panel_js)
        self.assertIn("if (backgroundTranscribeState === \"done\" && readSubtitlesItemsCount(snapshot.subtitlesPath) > 0)", panel_js)
        self.assertIn('var transcriptTimingSignature = "";', panel_js)
        self.assertIn("function getTranscriptTimingSignature()", panel_js)
        self.assertIn("function markTranscriptTimingStale(message)", panel_js)
        self.assertIn("Recognition model changed. Press Retiming to recalculate captions before Run.", panel_js)
        self.assertIn("Language changed. Press Retiming to recalculate captions before Run.", panel_js)
        self.assertIn("Audio source selection changed. Press Retiming to recalculate captions with the current model.", panel_js)
        self.assertIn("Background: Whisper restarted from current fast audio sources...", panel_js)
        self.assertIn("Retiming complete with current audio/model.", panel_js)

    def test_preset_picker_is_custom_not_native_visible_select(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        style_css = (ROOT / "panel" / "style.css").read_text(encoding="utf-8")
        self.assertIn('id="presetPicker"', panel_html)
        self.assertIn('id="presetPickerButton"', panel_html)
        self.assertIn('class="native-hidden-select"', panel_html)
        self.assertIn("function renderPresetPickerMenu()", panel_js)
        self.assertIn("function buildPresetPickerVisual(presetName, preset)", panel_js)
        self.assertIn("preset-picker-visual", panel_js)
        self.assertIn('data-preset-value', panel_js)
        self.assertIn("Static marker text with active word color only.", panel_js)
        self.assertIn("We will guide you through a specific sequence", panel_js)
        self.assertIn(".preset-picker-visual", style_css)
        preset_select = re.search(r'<select id="preset"[^>]*>(.*?)</select>', panel_html, flags=re.S)
        self.assertIsNotNone(preset_select)
        visible_presets = re.findall(r'<option value="([^"]+)"', preset_select.group(1))
        self.assertEqual(
            [
                "classic_clean",
                "static_marker_karaoke",
                "clean_paragraph",
                "modern_yellow",
                "bold_yellow_shadow",
                "reels_bold_yellow",
                "bold_two_words",
            ],
            visible_presets,
        )
        for hidden_box_preset in [
            "impact_yellow",
            "karaoke_classic",
            "white_caption",
            "social_clean",
            "box",
            "backplate_bold",
            "backplate_stack",
            "backplate_yellow",
        ]:
            self.assertNotIn(f'<option value="{hidden_box_preset}"', panel_html)

    def test_backplate_background_stays_engine_only_until_rebuilt(self):
        presets = json.loads((ROOT / "config" / "presets.json").read_text(encoding="utf-8"))
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")

        for name in ["backplate_bold", "backplate_stack", "backplate_yellow"]:
            plate = presets[name]
            self.assertTrue(plate["backplateEnabled"], msg=name)
            self.assertEqual(plate["backplateRenderMode"], "precomp", msg=name)
            self.assertFalse(plate["lineBoxEnabled"], msg=name)
            self.assertFalse(plate.get("boxEnabled", False), msg=name)
            self.assertFalse(plate.get("wordBoxEnabled", False), msg=name)
            self.assertEqual(plate["backplateColor"], [0, 0, 0], msg=name)
        self.assertIn('<option value="reels_bold_yellow">Reels: Bold yellow</option>', panel_html)
        self.assertNotIn('<option value="backplate_bold">Backplate: Bold</option>', panel_html)
        self.assertNotIn('<option value="backplate_stack">Backplate: Stack</option>', panel_html)
        self.assertNotIn('<option value="backplate_yellow">Backplate: Yellow</option>', panel_html)
        self.assertNotIn("Hug Lines", panel_html)
        self.assertIn("function createOrUpdateBackplateUnitCaption(comp, id, baseTextLayer, preparedItem, preset, updateMode, start, end)", jsx)
        self.assertIn('unitComp = app.project.items.addComp', jsx)
        self.assertIn('"SUBUNIT__" + id', jsx)
        self.assertIn('"BACKPLATE__" + lineId', jsx)
        self.assertIn("function _normalizeBackplatePreset(preset)", jsx)
        self.assertIn("payload.backplateEnabled = true;", panel_js)
        self.assertIn("payload.backplateEnabled = false;", panel_js)
        self.assertIn("payload.lineBoxEnabled = false;", panel_js)
        self.assertIn('buildStyleToken("Backplate", lineBoxHex', panel_js)

    def test_reels_bold_yellow_preset_matches_reference_style(self):
        presets = json.loads((ROOT / "config" / "presets.json").read_text(encoding="utf-8"))
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        style_css = (ROOT / "panel" / "style.css").read_text(encoding="utf-8")
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        preset = presets["reels_bold_yellow"]
        self.assertTrue(preset["forceUppercase"])
        self.assertTrue(preset["karaokeEnabled"])
        self.assertTrue(preset["shadowEnabled"])
        self.assertTrue(preset["strokeEnabled"])
        self.assertEqual(preset["strokeWidth"], 2)
        self.assertEqual(preset["accentWordIndex"], 0)
        self.assertEqual(preset["chunkTargetWords"], 4)
        self.assertGreaterEqual(preset["maxTextWidth"], 620)
        self.assertIn("reels_bold_yellow: true", panel_js)
        self.assertIn("accentWordIndex: 0", panel_js)
        self.assertIn("preset.accentWordIndex !== undefined", panel_js)
        self.assertIn('id="lineBoxEnabledControl"', panel_html)
        self.assertIn("lineBoxEnabledControlEl", panel_js)
        self.assertIn('styleOverrideState.lineBoxColor', panel_js)
        self.assertIn('buildStyleToken("Backplate", lineBoxHex', panel_js)
        self.assertIn('targetEl.classList.toggle("has-line-box"', panel_js)
        self.assertIn(".style-preview-text.has-line-box .style-preview-line", style_css)
        self.assertIn("function createOrUpdateBackplateUnitCaption(comp, id, baseTextLayer, preparedItem, preset, updateMode, start, end)", jsx)
        self.assertIn('"AEAS_BACKPLATE_UNIT__"', jsx)
        self.assertIn('"SUBUNIT__" + id', jsx)
        self.assertIn('"BACKPLATE__" + lineId', jsx)
        self.assertIn("if (_isBackplateEnabled(preset))", jsx)
        self.assertIn("function _markExpectedAutoLayerId(expectedIds, id)", jsx)
        self.assertIn("function _isExpectedAutoLayerId(expectedIds, id)", jsx)
        self.assertIn("function _isPartialUpdateMode(updateMode)", jsx)
        self.assertIn("_markExpectedAutoLayerId(expectedIds, id);", jsx)
        self.assertIn('mode === "patch_changed"', jsx)
        self.assertIn("if (_isPartialUpdateMode(updateMode))", jsx)
        self.assertIn("if (!_isExpectedAutoLayerId(expectedIds, id))", jsx)
        self.assertIn("function applyLayerOpacityAnimation(layer, start, end, preset)", jsx)
        self.assertIn("textLayer.sourceRectAtTime(sampleTime, false)", jsx)
        self.assertIn("rectLeft + (rectWidth / 2)", jsx)
        self.assertIn("layer.parent = textLayer;", jsx)
        self.assertIn("position.setValue([0, 0]);", jsx)
        self.assertIn('rect.property("ADBE Vector Rect Size").setValue', jsx)
        self.assertIn("applyLayerOpacityAnimation(unitLayer, start, end, preset);", jsx)
        self.assertIn("function _disableLegacyBoxWhenLineBoxIsEnabled(preset)", jsx)
        self.assertIn("payload.boxEnabled = false;", panel_js)
        self.assertIn("payload.wordBoxEnabled = false;", panel_js)

    def test_ae_renderer_scales_preview_design_to_target_comp(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn("function _getDesignScaleForComp(comp)", jsx)
        self.assertIn("var designWidth = vertical ? 1080 : 1920;", jsx)
        self.assertIn("var designHeight = vertical ? 1920 : 1080;", jsx)
        self.assertIn("function _scalePresetToComp(preset, comp)", jsx)
        self.assertIn('"fontSize",', jsx)
        self.assertIn('"maxTextWidth",', jsx)
        self.assertIn('"backplatePaddingX",', jsx)
        self.assertIn("_scalePresetToComp(preset, comp);", jsx)

    def test_text_updates_reapply_base_character_style_for_stroke(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn("function _setLayerText(layer, value, preset, wordRuleHighlights)", jsx)
        self.assertIn("function _setLayerTextAtTime(layer, timeSec, value, preset, wordRuleHighlights)", jsx)
        self.assertIn("_clearPropertyKeys(sourceText);", jsx)
        self.assertEqual(jsx.count("_resetDocumentStyles(doc);"), 3)
        self.assertEqual(jsx.count("_applyBaseStyleToAllCharacters(doc, preset, value);"), 2)
        self.assertIn("try { all.applyStroke = true; } catch (_eApplyStroke) {}", jsx)
        self.assertIn("try { all.strokeWidth = Number(preset.strokeWidth); } catch (_eStrokeWidth) {}", jsx)

    def test_clean_presets_purge_generated_background_helpers(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn("function _removeLayersByPrefix(comp, prefix)", jsx)
        self.assertIn("function _removeGeneratedBackgroundLayersForId(comp, id)", jsx)
        self.assertIn("function _removeAllGeneratedBackgroundLayers(comp)", jsx)
        self.assertIn('if (!usesGeneratedBackground) {', jsx)
        self.assertIn('_writeApplyStatus("layers:background_cleanup"', jsx)
        for prefix in ["SUBUNIT__", "SUBLINE__", "LINEBOX__", "BOX__", "SUBWORD__"]:
            self.assertIn(f'_removeLayersByPrefix(comp, "{prefix}")', jsx)

    def test_stroke_slider_uses_round_fill_over_stroke_defaults(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        self.assertIn("function _applyStrokeRenderDefaults(styleTarget)", jsx)
        self.assertIn("function _isStrokeEffectivelyEnabled(preset)", jsx)
        self.assertIn("_toNumber(preset.strokeWidth, 0) > 0", jsx)
        self.assertIn("styleTarget.strokeOverFill = false;", jsx)
        self.assertIn("LineJoinType.LINE_JOIN_ROUND", jsx)
        self.assertIn("function _applyTextLayerStrokeRenderOptions(textLayer, preset)", jsx)
        self.assertIn('textLayer.text("ADBE Text More Options")', jsx)
        self.assertIn('moreOptions("ADBE Text Render Order")', jsx)
        self.assertIn("var allFillsOverAllStrokes = 2;", jsx)
        self.assertIn("renderOrder.setValue(allFillsOverAllStrokes);", jsx)
        self.assertIn("textLayer.text.moreOption.fillANdStroke.setValue(allFillsOverAllStrokes);", jsx)
        self.assertIn("if (!textLayer || !_isStrokeEffectivelyEnabled(preset)) {", jsx)
        self.assertIn("if (_isStrokeEffectivelyEnabled(preset)) {", jsx)
        self.assertIn("_applyStrokeRenderDefaults(doc);", jsx)
        self.assertIn("_applyStrokeRenderDefaults(all);", jsx)
        self.assertIn("_applyTextLayerStrokeRenderOptions(textLayer, preset);", jsx)
        self.assertIn("var dirs = [", panel_js)
        self.assertIn("shadows.push((dirs[d][0] * r) + \"px \" + (dirs[d][1] * r) + \"px 0 \" + strokeColor);", panel_js)
        self.assertIn('targetEl.style.webkitTextStrokeWidth = "0px";', panel_js)
        self.assertIn('targetEl.style.paintOrder = strokeWidth ? "stroke fill" : "normal";', panel_js)
        self.assertIn('styleOverrideState.lineJoinType = "round";', panel_js)
        self.assertIn("styleOverrideState.strokeOverFill = false;", panel_js)

    def test_output_mode_and_language_use_custom_pickers(self):
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        panel_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")
        style_css = (ROOT / "panel" / "style.css").read_text(encoding="utf-8")
        self.assertIn('id="outputModePicker"', panel_html)
        self.assertIn('id="outputModePickerButton"', panel_html)
        self.assertIn('id="languagePicker"', panel_html)
        self.assertIn('id="languagePickerButton"', panel_html)
        self.assertIn("function renderOutputModePickerMenu()", panel_js)
        self.assertIn("function renderLanguagePickerMenu()", panel_js)
        self.assertIn("function updateOutputModePickerDisplay()", panel_js)
        self.assertIn("function updateLanguagePickerDisplay()", panel_js)
        self.assertIn('<option value="hinglish">hinglish</option>', panel_html)
        self.assertIn('if (value === "hinglish") return "Indo-English";', panel_js)
        self.assertIn("Hindi + English mix, output as Latin letters.", panel_js)
        self.assertIn("Wapas aane ka koi chance?", panel_js)
        self.assertIn("updateStylePreview({ randomize: true });", panel_js)
        self.assertIn(".advanced-style-details .font-picker-menu", style_css)
        self.assertIn("#btnScanSources {\n    align-self: flex-start;", style_css)
        self.assertIn("var cep = window.__adobe_cep__ || null;", panel_js)
        self.assertNotIn("if (!cep) {\n    setStatus(\"Preview mode. Open inside After Effects to scan, generate and apply captions.\");\n    return;\n  }", panel_js)
        self.assertIn("Open inside After Effects to scan the active comp.", panel_js)
        self.assertIn("if (!cep) {\n    setStatus(\"Preview mode. Open inside After Effects to scan, generate and apply captions.\");\n  } else if (!hasNodeBridge)", panel_js)
        self.assertNotIn("scanSourcesFromAe({ autoStart: true })", panel_js)
        self.assertIn("clip-path: inset(50%);", style_css)
        self.assertIn("@media (max-width: 420px)", style_css)
        self.assertIn(".caption-row {\n    grid-template-columns: 1fr;", style_css)

    def test_backend_exposes_hinglish_language_mode(self):
        backend = (ROOT / "backend" / "transcribe.py").read_text(encoding="utf-8")
        self.assertIn("Language: auto|en|uk|es|hinglish", backend)
        self.assertIn('return value in {"hinglish", "indo-english", "indian-english", "hi-latn", "hi-latin"}', backend)
        self.assertIn('return "hi"', backend)

    def test_chunk_overlap_dedupes_short_insert_fragments(self):
        sys.path.insert(0, str(ROOT))
        from backend.transcribe import _dedupe_items

        items = [
            {"start": 10.8, "end": 14.88, "text": "लिकिन एक गुड नूज है आपका मार्स शिक्स फाँस में है", "confidence": 0.5},
            {"start": 13.5, "end": 14.62, "text": "6th house में है", "confidence": 0.9},
            {"start": 24.42, "end": 26.98, "text": "और इसी वीक की अंदर वापस आसकती है", "confidence": 0.5},
            {"start": 26.98, "end": 28.48, "text": "अगर आप बी अपनी लव", "confidence": 0.5},
            {"start": 27.16, "end": 30.72, "text": "अगर आब बी अपनी love life के बारे में कुछ जाना चाते हैं", "confidence": 0.9},
        ]
        out = _dedupe_items(items)
        self.assertEqual(len(out), 3)
        self.assertNotIn("6th house", " ".join(item["text"] for item in out))
        self.assertIn("love life", " ".join(item["text"] for item in out))

    def test_timeline_items_are_stabilized_after_stt_overlap(self):
        sys.path.insert(0, str(ROOT))
        from backend.transcribe import _stabilize_timeline_items

        items = [
            {
                "start": 11.96,
                "end": 14.98,
                "text": "relationship aur shaadi ke baad",
                "words": [
                    {"start": 11.96, "end": 12.4, "text": "relationship"},
                    {"start": 12.4, "end": 13.0, "text": "aur"},
                    {"start": 13.0, "end": 14.98, "text": "baad"},
                ],
            },
            {
                "start": 13.5,
                "end": 15.68,
                "text": "aapki life kaisi rahegi",
                "words": [
                    {"start": 13.5, "end": 14.0, "text": "aapki"},
                    {"start": 14.0, "end": 15.68, "text": "rahegi"},
                ],
            },
        ]
        out = _stabilize_timeline_items(items)
        self.assertLessEqual(out[0]["end"], out[1]["start"])
        self.assertGreaterEqual(out[0]["words"][-1]["end"], out[0]["words"][-1]["start"])
        self.assertGreaterEqual(out[1]["words"][0]["start"], out[1]["start"])

    def test_shadow_style_support_present(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        self.assertIn('function applyShadowStyleToLayer(layer, preset)', jsx)
        self.assertIn('dropShadow/enabled', jsx)
        self.assertIn('buildPreviewTextShadowCss(preset, scale)', panel_js)

    def test_single_keys_box_support_present(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn('ensureBoxLayer(comp, "ALL_KEYS", textLayer, preset)', jsx)
        self.assertIn("var boxOpacityProp = null;", jsx)
        self.assertIn("boxOpacityProp.setValueAtTime(entryEnd, 100);", jsx)

    def test_word_box_karaoke_support_present(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        presets = json.loads((ROOT / "config" / "presets.json").read_text(encoding="utf-8"))
        self.assertTrue(presets["karaoke_classic"]["wordBoxEnabled"])
        self.assertTrue(presets["karaoke_classic"]["karaokeEnabled"])
        self.assertIn("function applyWordBoxOverlay(comp, id, baseTextLayer, preparedItem, preset, measureLayer, updateMode, basePosition)", jsx)
        self.assertIn('ensureBoxLayer(comp, "WORD__" + id, overlayLayer, wordBoxPreset)', jsx)
        self.assertIn("function _buildMaskedWordText(textValue, range)", jsx)
        self.assertIn('overlayLayer.moveBefore(baseTextLayer)', jsx)
        self.assertIn('overlayPreset.justification = "left";', jsx)
        self.assertIn('toComp([0,0,0])', jsx)
        self.assertIn("preset.wordBoxEnabled", panel_js)

    def test_word_box_controls_map_to_runtime_and_preview(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        panel_js = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
        self.assertIn("preset.wordBoxColor = [", jsx)
        self.assertIn("preset.wordBoxPaddingX = preset.boxPadding;", jsx)
        self.assertIn("preset.wordBoxRoundness = preset.boxRoundness;", jsx)
        self.assertIn("preset.wordBoxOpacity = preset.boxOpacity;", jsx)
        self.assertIn("preset.backplatePaddingX = preset.boxPadding;", jsx)
        self.assertIn("preset.backplateRoundness = preset.boxRoundness;", jsx)
        self.assertIn("preset.backplateOpacity = preset.boxOpacity;", jsx)
        self.assertIn("preset.wordBoxColor = styleOverrideState.boxColor.slice();", panel_js)
        self.assertIn("preset.wordBoxPaddingX = preset.boxPadding;", panel_js)
        self.assertIn("preset.wordBoxRoundness = preset.boxRoundness;", panel_js)
        self.assertIn("preset.wordBoxOpacity = preset.boxOpacity;", panel_js)
        self.assertIn("preset.backplatePaddingX = preset.boxPadding;", panel_js)
        self.assertIn("preset.backplateRoundness = preset.boxRoundness;", panel_js)
        self.assertIn("preset.backplateOpacity = preset.boxOpacity;", panel_js)
        self.assertIn("function getPresetBackgroundOpacity(preset)", panel_js)
        self.assertIn("Background Opacity", (ROOT / "panel" / "index.html").read_text(encoding="utf-8"))

    def test_word_rule_highlights_apply_in_ae_text_document(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn("function _applyWordRuleHighlights(doc, highlights)", jsx)
        self.assertIn("range.fillColor = [", jsx)
        self.assertIn("range.strokeColor = [", jsx)
        self.assertIn("_applyWordRuleHighlights(doc, wordRuleHighlights);", jsx)
        self.assertIn("_makeStyledDocument(sourceText, textValue, preset, range, item.wordRuleHighlights)", jsx)
        self.assertIn("_setLayerText(textLayer, textValue, preset, preparedItem.wordRuleHighlights)", jsx)

    def test_jsx_approximates_words_when_json_has_none(self):
        jsx = (ROOT / "scripts" / "create_subtitles.jsx").read_text(encoding="utf-8")
        self.assertIn("function _approximateItemWords(start, end, textValue)", jsx)
        self.assertIn("function _getItemWordEntries(item, textValue)", jsx)
        self.assertIn("preparedItem.words = _getItemWordEntries(preparedItem, textValue);", jsx)

    def test_installed_copy_is_in_sync(self):
        if not INSTALLED_ROOT.exists():
            self.skipTest("Installed CEP extension not present on this machine.")

        pairs = [
            (ROOT / "VERSION", INSTALLED_ROOT / "VERSION"),
            (ROOT / "config" / "presets.json", INSTALLED_ROOT / "config" / "presets.json"),
            (ROOT / "scripts" / "create_subtitles.jsx", INSTALLED_ROOT / "scripts" / "create_subtitles.jsx"),
            (ROOT / "scripts" / "ae_layout_selftest.jsx", INSTALLED_ROOT / "scripts" / "ae_layout_selftest.jsx"),
            (ROOT / "scripts" / "verify_ae_layout.py", INSTALLED_ROOT / "scripts" / "verify_ae_layout.py"),
            (ROOT / "scripts" / "verify_ae_timing.py", INSTALLED_ROOT / "scripts" / "verify_ae_timing.py"),
            (ROOT / "scripts" / "native_qa.py", INSTALLED_ROOT / "scripts" / "native_qa.py"),
            (ROOT / "panel" / "main.js", INSTALLED_ROOT / "main.js"),
            (ROOT / "panel" / "index.html", INSTALLED_ROOT / "index.html"),
            (ROOT / "panel" / "style.css", INSTALLED_ROOT / "style.css"),
            (ROOT / "panel" / "CSXS" / "manifest.xml", INSTALLED_ROOT / "CSXS" / "manifest.xml"),
            (ROOT / "backend" / "transcribe.py", INSTALLED_ROOT / "backend" / "transcribe.py"),
            (ROOT / "backend" / "postprocess.py", INSTALLED_ROOT / "backend" / "postprocess.py"),
        ]
        for repo_file, installed_file in pairs:
            self.assertTrue(installed_file.exists(), msg=f"Missing installed file: {installed_file}")
            self.assertEqual(
                repo_file.read_text(encoding="utf-8"),
                installed_file.read_text(encoding="utf-8"),
                msg=f"Installed copy out of sync: {installed_file}",
            )


if __name__ == "__main__":
    unittest.main()
