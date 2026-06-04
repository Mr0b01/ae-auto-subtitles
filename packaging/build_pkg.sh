#!/bin/zsh
set -euo pipefail
export COPYFILE_DISABLE=1

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/build"
PKGROOT="$BUILD_DIR/pkgroot"
SCRIPTS_DIR="$BUILD_DIR/scripts"
DIST_DIR="$PROJECT_ROOT/dist"
WHEEL_DIR="$BUILD_DIR/wheels"
PKG_ID="com.airliner.aeautosubtitles.installer"
PKG_VERSION="$(cat "$PROJECT_ROOT/VERSION" | tr -d '[:space:]')"
PKG_NAME="AE-Auto-Subtitles-Installer-${PKG_VERSION}.pkg"
PKG_PATH="$DIST_DIR/$PKG_NAME"
PYTHON_BIN="$PROJECT_ROOT/.venv/bin/python3"

rm -rf "$PKGROOT" "$SCRIPTS_DIR" "$WHEEL_DIR"
mkdir -p "$PKGROOT/Library/Application Support/AEAutoSubtitlesInstaller/extension/com.airliner.aeautosubtitles"
mkdir -p "$SCRIPTS_DIR" "$DIST_DIR" "$WHEEL_DIR"

EXT_DIR="$PKGROOT/Library/Application Support/AEAutoSubtitlesInstaller/extension/com.airliner.aeautosubtitles"

# Core panel files
rsync -a --exclude '.DS_Store' "$PROJECT_ROOT/panel/index.html" "$EXT_DIR/index.html"
rsync -a --exclude '.DS_Store' "$PROJECT_ROOT/panel/main.js" "$EXT_DIR/main.js"
rsync -a --exclude '.DS_Store' "$PROJECT_ROOT/panel/style.css" "$EXT_DIR/style.css"
rsync -a --exclude '.DS_Store' "$PROJECT_ROOT/panel/CSXS/" "$EXT_DIR/CSXS/"

# Runtime backend files
rsync -a --exclude '__pycache__' --exclude '.DS_Store' "$PROJECT_ROOT/backend/" "$EXT_DIR/backend/"
rsync -a --exclude '__pycache__' --exclude '.DS_Store' "$PROJECT_ROOT/scripts/" "$EXT_DIR/scripts/"
rsync -a --exclude '.DS_Store' "$PROJECT_ROOT/config/" "$EXT_DIR/config/"
mkdir -p "$EXT_DIR/tmp" "$EXT_DIR/runtime/bin" "$EXT_DIR/runtime/models" "$EXT_DIR/runtime/wheels"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "ERROR: missing builder python at $PYTHON_BIN"
  exit 1
fi

# Bundle wheels for offline dependency install.
"$PYTHON_BIN" -m pip download -r "$PROJECT_ROOT/backend/requirements.txt" -d "$WHEEL_DIR"
rsync -a "$WHEEL_DIR/" "$EXT_DIR/runtime/wheels/"

# Bundle static ffmpeg binary (from imageio-ffmpeg) for offline runtime.
"$PYTHON_BIN" -m pip install imageio-ffmpeg >/dev/null
FFMPEG_SRC="$($PYTHON_BIN - <<'PY'
import imageio_ffmpeg
print(imageio_ffmpeg.get_ffmpeg_exe())
PY
)"
if [[ -f "$FFMPEG_SRC" ]]; then
  cp "$FFMPEG_SRC" "$EXT_DIR/runtime/bin/ffmpeg"
  chmod +x "$EXT_DIR/runtime/bin/ffmpeg"
fi

# Bundle cached Whisper Turbo model if present. If it is not cached, runtime
# faster-whisper will download it on first use.
MODEL_SNAPSHOT="$($PYTHON_BIN - <<'PY'
try:
    from huggingface_hub import snapshot_download
    print(snapshot_download("mobiuslabsgmbh/faster-whisper-large-v3-turbo", local_files_only=True))
except Exception:
    print("")
PY
)"
if [[ -n "$MODEL_SNAPSHOT" && -d "$MODEL_SNAPSHOT" ]]; then
  # Hugging Face snapshots often contain symlinks into ../../blobs.
  # Use -L to materialize real files in the package payload.
  rsync -aL --exclude '.DS_Store' "$MODEL_SNAPSHOT/" "$EXT_DIR/runtime/models/faster-whisper-turbo/"
fi

# Optional docs in extension root
rsync -a --exclude '.DS_Store' "$PROJECT_ROOT/README.md" "$EXT_DIR/README.md"
rsync -a --exclude '.DS_Store' "$PROJECT_ROOT/install.md" "$EXT_DIR/install.md"

# Strip metadata files from staging root.
find "$PKGROOT" -name '._*' -delete || true
find "$PKGROOT" -name '__pycache__' -type d -prune -exec rm -rf {} + || true
xattr -cr "$PKGROOT" >/dev/null 2>&1 || true
dot_clean -m "$PKGROOT" >/dev/null 2>&1 || true

# Installer scripts
cp "$PROJECT_ROOT/packaging/postinstall" "$SCRIPTS_DIR/postinstall"
chmod +x "$SCRIPTS_DIR/postinstall"

rm -f "$PKG_PATH"
pkgbuild \
  --root "$PKGROOT" \
  --identifier "$PKG_ID" \
  --version "$PKG_VERSION" \
  --scripts "$SCRIPTS_DIR" \
  "$PKG_PATH"

echo "Built: $PKG_PATH"
