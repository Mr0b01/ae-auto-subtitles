#!/usr/bin/env python3
"""Check release-facing repository hygiene.

This script intentionally stays dependency-free so it can run locally and in
GitHub Actions before a release page or installer is published.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CURRENT_VERSION = (ROOT / "VERSION").read_text(encoding="utf-8").strip()

FORBIDDEN_PATH_PARTS = (
    ".DS_Store",
    "__pycache__",
    ".pytest_cache",
)

FORBIDDEN_SUFFIXES = (
    ".pyc",
    ".pyo",
)

FORBIDDEN_TEXT_PATTERNS = (
    re.compile(re.escape("/Users/" + "airliner") + r"\b"),
    re.compile(r"/Users/[A-Za-z0-9._-]+/(?:Desktop|Documents|Downloads|Library|Movies|Pictures)\b"),
)

TEXT_EXTENSIONS = {
    ".css",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".jsxinc",
    ".md",
    ".py",
    ".sh",
    ".txt",
    ".xml",
    ".yml",
    ".yaml",
}


def git_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return [ROOT / line for line in result.stdout.splitlines() if line.strip()]


def is_text_file(path: Path) -> bool:
    return path.suffix.lower() in TEXT_EXTENSIONS


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def check_tracked_artifacts(paths: list[Path]) -> list[str]:
    failures: list[str] = []
    for path in paths:
        relative = rel(path)
        if any(part in path.parts for part in FORBIDDEN_PATH_PARTS):
            failures.append(f"generated/cache file is tracked: {relative}")
        if path.name.startswith("._") or path.suffix in FORBIDDEN_SUFFIXES:
            failures.append(f"generated/cache file is tracked: {relative}")
    return failures


def check_forbidden_text(paths: list[Path]) -> list[str]:
    failures: list[str] = []
    for path in paths:
        if not path.exists():
            continue
        if not is_text_file(path):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in FORBIDDEN_TEXT_PATTERNS:
            match = pattern.search(text)
            if match:
                failures.append(f"{rel(path)} contains local machine path: {match.group(0)}")
    return failures


def check_release_links() -> list[str]:
    failures: list[str] = []
    expected_pkg = f"AE-Auto-Subtitles-Installer-{CURRENT_VERSION}.pkg"
    for name in ("README.md", "install.md"):
        text = (ROOT / name).read_text(encoding="utf-8")
        if expected_pkg not in text:
            failures.append(f"{name} does not reference current installer asset {expected_pkg}")
        stale = re.findall(r"AE-Auto-Subtitles-Installer-(\d+\.\d+\.\d+)\.pkg", text)
        stale_versions = sorted(set(version for version in stale if version != CURRENT_VERSION))
        if stale_versions:
            failures.append(f"{name} references stale installer versions: {', '.join(stale_versions)}")

    release_notes = ROOT / "release-notes" / f"v{CURRENT_VERSION}.md"
    if not release_notes.exists():
        failures.append(f"missing release notes for current version: {rel(release_notes)}")
    return failures


def check_readme_local_assets() -> list[str]:
    failures: list[str] = []
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for src in re.findall(r'src="([^":]+)"', readme):
        if src.startswith(("http", "#")):
            continue
        asset_path = ROOT / src
        if not asset_path.exists():
            failures.append(f"README asset does not exist: {src}")
    return failures


def main() -> int:
    paths = git_files()
    failures = []
    failures.extend(check_tracked_artifacts(paths))
    failures.extend(check_forbidden_text(paths))
    failures.extend(check_release_links())
    failures.extend(check_readme_local_assets())

    if failures:
        print("Public hygiene check failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print("Public hygiene check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
