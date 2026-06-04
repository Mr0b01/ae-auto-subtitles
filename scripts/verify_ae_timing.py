#!/usr/bin/env python3
"""Run a real After Effects subtitle timing self-test.

This catches the class of bug where the transcript text is right, but chunked
subtitle layers drift because AE-side chunking redistributes word timings.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNNER = Path(
    "/Users/airliner/Documents/Codex/2026-05-11/"
    "https-github-com-aedev-tools-adobe/skills/after-effects/scripts/runner.sh"
)


CASE = {
    "id": "timing",
    "start": 0.0,
    "end": 4.7,
    "text": "kundli mein rahu mangal ke beech",
    "words": [
        {"start": 0.0, "end": 0.3, "text": "kundli"},
        {"start": 0.4, "end": 0.6, "text": "mein"},
        {"start": 1.0, "end": 1.2, "text": "rahu"},
        {"start": 3.4, "end": 3.7, "text": "mangal"},
        {"start": 4.0, "end": 4.15, "text": "ke"},
        {"start": 4.3, "end": 4.7, "text": "beech"},
    ],
}

STYLE_OVERRIDES = {
    "font": "Arial-BoldMT",
    "fontSize": 78,
    "maxLines": 2,
    "maxTextWidth": 900,
    "chunkWordsEnabled": True,
    "chunkMinWords": 3,
    "chunkMaxWords": 3,
    "chunkTargetWords": 3,
    "redistributeChunkTimings": False,
    "strokeEnabled": False,
    "strokeWidth": 0,
    "boxEnabled": False,
    "boxSmart": False,
    "wordBoxEnabled": False,
    "backplateEnabled": False,
    "lineBoxEnabled": False,
    "animEnabled": False,
    "marginY": 224,
    "verticalMarginY": 224,
    "positionOffsetX": 0,
}

EXPECTED = {
    "SUB__timing__01": {
        "inPoint": 0.0,
        "outPoint": 1.2,
        "text": "KUNDLI MEIN RAHU",
    },
    "SUB__timing__02": {
        "inPoint": 3.4,
        "outPoint": 4.7,
        "text": "MANGAL KE BEECH",
    },
}


def _write_subtitle_fixture() -> Path:
    path = ROOT / "tmp" / "ae_timing_selftest_subtitles.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"items": [CASE]}, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def _norm_text(value: str) -> str:
    return " ".join(str(value or "").replace("\r", " ").replace("\n", " ").split())


def _near(actual: float, expected: float, tolerance: float = 0.05) -> bool:
    return abs(float(actual) - float(expected)) <= tolerance


def main() -> int:
    if not RUNNER.exists():
        print(f"ERROR: AE runner not found: {RUNNER}", file=sys.stderr)
        return 2

    subtitles_path = _write_subtitle_fixture()
    args = {
        "repoRoot": str(ROOT),
        "rendererPath": str(ROOT / "scripts" / "create_subtitles.jsx"),
        "subtitlesPath": str(subtitles_path),
        "presetsPath": str(ROOT / "config" / "presets.json"),
        "presetName": "bold_yellow_shadow",
        "marginY": "224",
        "outputMode": "layers",
        "styleOverridesJson": json.dumps(STYLE_OVERRIDES, separators=(",", ":")),
        "cleanup": True,
    }
    cmd = [str(RUNNER), "--background", str(ROOT / "scripts" / "ae_layout_selftest.jsx"), json.dumps(args)]
    proc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True, check=False, timeout=90)
    if proc.returncode != 0:
        print(proc.stdout.strip())
        print(proc.stderr.strip(), file=sys.stderr)
        return proc.returncode

    try:
        result = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        print(proc.stdout)
        print(f"ERROR: cannot parse AE timing self-test output: {exc}", file=sys.stderr)
        return 2

    layers = {str(layer.get("name", "")): layer for layer in result.get("layers", [])}
    failures: list[str] = []
    if not result.get("ok"):
        failures.append(f"AE timing apply failed: {result.get('applyResult') or result.get('error')}")
    if result.get("measureHelpers"):
        failures.append(f"measure helpers leaked: {result['measureHelpers']}")

    for name, expected in EXPECTED.items():
        layer = layers.get(name)
        if not layer:
            failures.append(f"missing layer {name}")
            continue
        for key in ("inPoint", "outPoint"):
            if not _near(float(layer.get(key, -999)), float(expected[key])):
                failures.append(f"{name} {key}={layer.get(key)} expected {expected[key]}")
        if _norm_text(layer.get("text", "")) != expected["text"]:
            failures.append(f"{name} text={_norm_text(layer.get('text', ''))!r} expected {expected['text']!r}")

    unexpected_subs = sorted(name for name in layers if name.startswith("SUB__timing") and name not in EXPECTED)
    if unexpected_subs:
        failures.append(f"unexpected timing layers: {unexpected_subs}")

    print(json.dumps({
        "ok": not failures,
        "applyResult": result.get("applyResult"),
        "expected": EXPECTED,
        "layers": [
            {
                "name": layer.get("name"),
                "text": layer.get("text"),
                "inPoint": layer.get("inPoint"),
                "outPoint": layer.get("outPoint"),
            }
            for layer in result.get("layers", [])
        ],
        "failures": failures,
    }, ensure_ascii=False, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
