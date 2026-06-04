#!/usr/bin/env python3
"""Native QA runner for AED Subtitles.

This is the one command/button to run before claiming preview/render layout
fixes. It combines cheap static checks with the real After Effects layout
self-test, then writes a machine-readable report to tmp/native_qa_report.json.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path


def resolve_repo_root(script_path: Path) -> Path:
    local_root = script_path.resolve().parents[1]
    if (local_root / "tests").exists() and (local_root / "panel" / "main.js").exists():
        return local_root

    dev_root = Path("/Users/airliner/ae-auto-subtitles")
    if (dev_root / "tests").exists() and (dev_root / "panel" / "main.js").exists():
        return dev_root

    return local_root


ROOT = resolve_repo_root(Path(__file__))
REPORT_PATH = ROOT / "tmp" / "native_qa_report.json"


def progress(percent: int, message: str) -> None:
    print(f"AEAS_PROGRESS {percent} {message}", flush=True)


def run_step(name: str, cmd: list[str], timeout: int = 60) -> dict:
    started = time.time()
    proc = subprocess.run(
        cmd,
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        check=False,
        timeout=timeout,
    )
    return {
        "name": name,
        "command": cmd,
        "ok": proc.returncode == 0,
        "returncode": proc.returncode,
        "seconds": round(time.time() - started, 3),
        "stdout": (proc.stdout or "").strip(),
        "stderr": (proc.stderr or "").strip(),
    }


def check_file_contains() -> dict:
    source = (ROOT / "panel" / "main.js").read_text(encoding="utf-8")
    checks = {
        "preview_overflow_matches_ae": "(overflow * 1000) +" in source and "(overflow * 100000) +" not in source,
        "preview_hook_available": "window.AEAS_TEST_HOOKS" in source,
        "preview_query_result_available": "data-aeas-preview-result" in source,
    }
    return {
        "name": "preview parity static guards",
        "ok": all(checks.values()),
        "checks": checks,
    }


def node_check_jsx_without_includes(path: Path, name: str) -> dict:
    with tempfile.TemporaryDirectory() as tmpdir:
        check_path = Path(tmpdir) / (path.stem + ".js")
        lines = [
            line for line in path.read_text(encoding="utf-8").splitlines()
            if not line.lstrip().startswith("#include ")
        ]
        check_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        return run_step(name, ["node", "--check", str(check_path)], timeout=20)


def node_check_plain_jsx(path: Path, name: str) -> dict:
    with tempfile.TemporaryDirectory() as tmpdir:
        check_path = Path(tmpdir) / (path.stem + ".js")
        shutil.copyfile(path, check_path)
        return run_step(name, ["node", "--check", str(check_path)], timeout=20)


def main() -> int:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "ok": False,
        "startedAt": int(time.time()),
        "steps": [],
    }

    def add(step: dict) -> bool:
        report["steps"].append(step)
        return bool(step.get("ok"))

    try:
        progress(8, "Native QA: checking panel syntax...")
        add(run_step("panel main.js syntax", ["node", "--check", "panel/main.js"], timeout=20))

        progress(18, "Native QA: checking JSX syntax...")
        add(node_check_plain_jsx(ROOT / "scripts" / "create_subtitles.jsx", "create_subtitles.jsx syntax"))
        add(node_check_jsx_without_includes(ROOT / "scripts" / "ae_layout_selftest.jsx", "ae_layout_selftest.jsx syntax"))

        progress(30, "Native QA: checking Python syntax...")
        add(run_step(
            "python py_compile",
            [
                sys.executable,
                "-m",
                "py_compile",
                "backend/transcribe.py",
                "backend/postprocess.py",
                "backend/io_json.py",
                "scripts/verify_ae_layout.py",
                "scripts/verify_ae_timing.py",
                "scripts/native_qa.py",
            ],
            timeout=30,
        ))

        progress(42, "Native QA: checking preview parity guards...")
        add(check_file_contains())

        progress(54, "Native QA: running unit smoke tests...")
        add(run_step("unit smoke tests", [sys.executable, "-m", "unittest", "discover", "-s", "tests"], timeout=60))

        progress(74, "Native QA: running real AE layout self-test...")
        add(run_step("real AE layout self-test", [sys.executable, "scripts/verify_ae_layout.py"], timeout=120))

        progress(86, "Native QA: running real AE timing self-test...")
        add(run_step("real AE timing self-test", [sys.executable, "scripts/verify_ae_timing.py"], timeout=120))

        failed = [step for step in report["steps"] if not step.get("ok")]
        report["ok"] = not failed
        report["completedAt"] = int(time.time())
        report["failedSteps"] = [step.get("name") for step in failed]
        REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

        if report["ok"]:
            progress(100, "Native QA passed")
        else:
            progress(100, "Native QA failed")

        summary = {
            "ok": report["ok"],
            "report": str(REPORT_PATH),
            "steps": [
                {
                    "name": step.get("name"),
                    "ok": step.get("ok"),
                    "seconds": step.get("seconds"),
                    "returncode": step.get("returncode"),
                }
                for step in report["steps"]
            ],
            "failedSteps": report.get("failedSteps", []),
        }
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0 if report["ok"] else 1
    except subprocess.TimeoutExpired as exc:
        report["ok"] = False
        report["error"] = f"Timeout: {exc}"
        report["completedAt"] = int(time.time())
        REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps({"ok": False, "error": report["error"], "report": str(REPORT_PATH)}, ensure_ascii=False, indent=2))
        return 124


if __name__ == "__main__":
    raise SystemExit(main())
