import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class StyleMatrixTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.presets = json.loads((ROOT / "config" / "presets.json").read_text(encoding="utf-8"))
        cls.index_html = (ROOT / "panel" / "index.html").read_text(encoding="utf-8")

    def _visible_preset_options(self):
        match = re.search(r'<select[^>]*id="preset"[^>]*>(.*?)</select>', self.index_html, re.S)
        self.assertIsNotNone(match, msg="Preset select not found in panel HTML")
        return re.findall(r'<option value="([^"]+)">', match.group(1))

    def test_visible_preset_options_exist_in_config(self):
        options = self._visible_preset_options()
        missing = [name for name in options if name not in self.presets]
        self.assertEqual(missing, [], msg=f"Preset options missing from config: {missing}")

    def test_visible_presets_have_display_names(self):
        options = self._visible_preset_options()
        missing = [name for name in options if not self.presets.get(name, {}).get("displayName")]
        self.assertEqual(missing, [], msg=f"Visible presets missing displayName: {missing}")

    def test_visible_presets_are_large_and_boxless(self):
        for name in self._visible_preset_options():
            preset = self.presets[name]
            self.assertGreaterEqual(preset.get("fontSize", 0), 72, msg=name)
            self.assertFalse(preset.get("boxEnabled", False), msg=name)
            self.assertFalse(preset.get("wordBoxEnabled", False), msg=name)

    def test_numeric_ranges_are_sane(self):
        for name, preset in self.presets.items():
            if "fontSize" in preset:
                self.assertGreaterEqual(preset["fontSize"], 12, msg=name)
                self.assertLessEqual(preset["fontSize"], 240, msg=name)
            if "strokeWidth" in preset:
                self.assertGreaterEqual(preset["strokeWidth"], 0, msg=name)
                self.assertLessEqual(preset["strokeWidth"], 24, msg=name)
            if "marginY" in preset:
                self.assertGreaterEqual(preset["marginY"], 0, msg=name)
                self.assertLessEqual(preset["marginY"], 800, msg=name)
            if "maxTextWidth" in preset:
                self.assertGreaterEqual(preset["maxTextWidth"], 140, msg=name)
                self.assertLessEqual(preset["maxTextWidth"], 1200, msg=name)

    def test_reference_styles_keep_expected_mechanics(self):
        self.assertFalse(self.presets["classic_clean"]["strokeEnabled"])
        self.assertFalse(self.presets["classic_clean"]["boxEnabled"])
        self.assertFalse(self.presets["classic_clean"]["shadowEnabled"])

        marker = self.presets["static_marker_karaoke"]
        self.assertTrue(marker["karaokeEnabled"])
        self.assertFalse(marker["chunkWordsEnabled"])
        self.assertFalse(marker["animEnabled"])
        self.assertFalse(marker["strokeEnabled"])
        self.assertFalse(marker["boxEnabled"])
        self.assertEqual(marker["accentColor"], [0.58, 0.03, 0.09])

        self.assertFalse(self.presets["clean_paragraph"]["strokeEnabled"])
        self.assertFalse(self.presets["clean_paragraph"]["boxEnabled"])

        self.assertTrue(self.presets["modern_yellow"]["karaokeEnabled"])
        self.assertTrue(self.presets["modern_yellow"]["shadowEnabled"])

        self.assertTrue(self.presets["impact_yellow"]["boxEnabled"])
        self.assertTrue(self.presets["impact_yellow"]["shadowEnabled"])
        self.assertTrue(self.presets["impact_yellow"]["forceUppercase"])

        self.assertTrue(self.presets["bold_yellow_shadow"]["shadowEnabled"])
        self.assertFalse(self.presets["bold_yellow_shadow"]["strokeEnabled"])

        self.assertTrue(self.presets["bold_two_words"]["forceTwoLines"])
        self.assertTrue(self.presets["bold_two_words"]["shadowEnabled"])

        for name in ["backplate_bold", "backplate_stack", "backplate_yellow"]:
            self.assertTrue(self.presets[name]["backplateEnabled"], msg=name)
            self.assertEqual(self.presets[name]["backplateRenderMode"], "precomp", msg=name)
            self.assertFalse(self.presets[name]["lineBoxEnabled"], msg=name)
            self.assertFalse(self.presets[name].get("boxEnabled", False), msg=name)
            self.assertFalse(self.presets[name].get("wordBoxEnabled", False), msg=name)

        self.assertTrue(self.presets["karaoke_classic"]["wordBoxEnabled"])
        self.assertTrue(self.presets["karaoke_classic"]["karaokeEnabled"])
        self.assertEqual(self.presets["karaoke_classic"]["wordFillColor"], [1, 1, 1])

    def test_word_box_styles_have_required_values(self):
        for name, preset in self.presets.items():
            if not preset.get("wordBoxEnabled"):
                continue
            self.assertIn("wordBoxColor", preset, msg=name)
            self.assertIn("wordBoxPaddingX", preset, msg=name)
            self.assertIn("wordBoxPaddingY", preset, msg=name)
            self.assertIn("wordBoxRoundness", preset, msg=name)
            self.assertIn("wordFillColor", preset, msg=name)


if __name__ == "__main__":
    unittest.main()
