# Release Checklist

Use this before publishing a GitHub release or installer asset.

## Version

- `VERSION` matches the intended release.
- `panel/main.js` `APP_VERSION` matches `VERSION`.
- `panel/index.html` visible version matches `VERSION`.
- `panel/CSXS/manifest.xml` matches `VERSION`.
- `README.md` installer asset name matches `VERSION`.
- `install.md` installer asset name matches `VERSION`.
- `release-notes/v<version>.md` exists.

## Hygiene

```bash
sh scripts/preflight.sh
```

This runs public hygiene, syntax checks, and unit smoke tests. The hygiene step catches local machine paths, tracked generated files, missing README assets, and stale installer links.

## Tests

```bash
node --check panel/main.js
python -m py_compile backend/transcribe.py backend/postprocess.py backend/io_json.py scripts/native_qa.py scripts/verify_ae_layout.py scripts/verify_ae_timing.py scripts/check_public_hygiene.py
python -m unittest discover -s tests
python "$HOME/Library/Application Support/Adobe/CEP/extensions/com.airliner.aeautosubtitles/scripts/native_qa.py"
```

## Build

```bash
zsh packaging/build_pkg.sh
shasum -a 256 "dist/AE-Auto-Subtitles-Installer-$(cat VERSION).pkg"
```

## Publish

```bash
git tag -a "v$(cat VERSION)" -m "AED Subtitles v$(cat VERSION)"
git push origin main "v$(cat VERSION)"
gh release create "v$(cat VERSION)" \
  "dist/AE-Auto-Subtitles-Installer-$(cat VERSION).pkg" \
  --title "AED Subtitles v$(cat VERSION)" \
  --notes-file "release-notes/v$(cat VERSION).md" \
  --latest
```

## Verify GitHub

```bash
gh release view "v$(cat VERSION)" --json tagName,isDraft,isPrerelease,url,assets
curl -I -L "https://github.com/Mr0b01/ae-auto-subtitles/releases/latest/download/AE-Auto-Subtitles-Installer-$(cat VERSION).pkg"
```
