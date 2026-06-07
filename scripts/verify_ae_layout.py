#!/usr/bin/env python3
"""Run a real After Effects subtitle layout self-test.

This creates a temporary comp, applies the production JSX renderer to a few
known-problem phrases, inspects the actual AE text layers, then removes the
temporary comp. It is intentionally separate from unit smoke tests because it
checks the thing users see: AE's final Source Text line breaks.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def resolve_ae_runner() -> Path:
    env_runner = os.environ.get("AEAS_AE_RUNNER")
    if env_runner:
        return Path(env_runner).expanduser()

    candidates = [
        Path.home() / "Documents/Codex/2026-05-11/https-github-com-aedev-tools-adobe/skills/after-effects/scripts/runner.sh",
        Path.home() / ".codex/skills/after-effects/scripts/runner.sh",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


RUNNER = resolve_ae_runner()


CASES = [
    {
        "id": "0001",
        "start": 0.0,
        "end": 2.0,
        "text": "ki tumhari shaadi kisse hogi?",
    },
    {
        "id": "0002",
        "start": 2.2,
        "end": 4.6,
        "text": "ke beech sach mein chemistry hai Hum ek baar coffee pe bhi",
    },
    {
        "id": "0003",
        "start": 4.8,
        "end": 7.0,
        "text": "Maine recently wahan ek astrologer se baat",
    },
]

STYLE_OVERRIDES = {
    "font": "Arial-BoldMT",
    "fontSize": 78,
    "maxLines": 3,
    "maxTextWidth": 500,
    "blockScale": 91,
    "strokeEnabled": False,
    "strokeWidth": 0,
    "boxEnabled": False,
    "boxSmart": False,
    "wordBoxEnabled": False,
    "backplateEnabled": False,
    "lineBoxEnabled": False,
    "marginY": 224,
    "verticalMarginY": 224,
    "positionOffsetX": 0,
}


def _word_timings(text: str, start: float, end: float) -> list[dict[str, float | str]]:
    words = text.split()
    if not words:
        return []
    duration = max(0.03, end - start)
    step = duration / len(words)
    out = []
    cursor = start
    for index, word in enumerate(words):
        word_end = end if index == len(words) - 1 else start + ((index + 1) * step)
        out.append({"start": round(cursor, 3), "end": round(word_end, 3), "text": word})
        cursor = word_end
    return out


def _write_subtitle_fixture() -> Path:
    path = ROOT / "tmp" / "ae_layout_selftest_subtitles.json"
    items = []
    for case in CASES:
        item = dict(case)
        item["words"] = _word_timings(case["text"], case["start"], case["end"])
        items.append(item)
    path.write_text(json.dumps({"items": items}, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def _split_lines(text: str) -> list[str]:
    return [line.strip() for line in re.split(r"[\r\n]+", text or "") if line.strip()]


def _word_count(line: str) -> int:
    return len([part for part in re.split(r"\s+", line.strip()) if part])


def _validate_layers(layers: list[dict]) -> list[str]:
    failures: list[str] = []
    for case in CASES:
        matching_layers = [
            layer for layer in layers
            if str(layer.get("name", "")) == f"SUB__{case['id']}" or
            str(layer.get("name", "")).startswith(f"SUB__{case['id']}__")
        ]
        if not matching_layers:
            failures.append(f"missing layer SUB__{case['id']}")
            continue
        for layer in matching_layers:
            name = str(layer.get("name", f"SUB__{case['id']}"))
            lines = _split_lines(str(layer.get("text", "")))
            total_words = _word_count(" ".join(lines))
            if not lines:
                failures.append(f"{name} rendered empty text")
                continue
            if len(lines) > int(STYLE_OVERRIDES["maxLines"]):
                failures.append(f"{name} uses {len(lines)} lines > maxLines")
            counts = [_word_count(line) for line in lines]
            if total_words >= 4 and len(lines) > 1:
                edge_single = (counts[0] == 1) or (counts[-1] == 1)
                if edge_single:
                    failures.append(f"{name} has orphan edge line: {lines}")
                if max(counts) - min(counts) >= 4:
                    failures.append(f"{name} has badly imbalanced lines: {lines}")
            if case["id"] == "0001" and lines[:2] == ["ki", "tumhari shaadi kisse hogi?"]:
                failures.append("SUB__0001 reproduced the exact bad `ki` orphan layout")
    return failures


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
        "presetName": "classic_clean",
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
        print(f"ERROR: cannot parse AE self-test output: {exc}", file=sys.stderr)
        return 2

    failures = []
    if not result.get("ok"):
        failures.append(f"AE self-test apply failed: {result.get('applyResult') or result.get('error')}")
    if result.get("measureHelpers"):
        failures.append(f"measure helpers leaked: {result['measureHelpers']}")
    if result.get("backgroundHelpers"):
        failures.append(f"background helpers leaked in no-background preset: {result['backgroundHelpers']}")
    failures.extend(_validate_layers(result.get("layers") or []))

    print(json.dumps({
        "ok": not failures,
        "applyResult": result.get("applyResult"),
        "layers": [
            {
                "name": layer.get("name"),
                "text": layer.get("text"),
                "position": layer.get("position"),
                "rect": layer.get("rect"),
            }
            for layer in result.get("layers", [])
        ],
        "failures": failures,
    }, ensure_ascii=False, indent=2))

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
