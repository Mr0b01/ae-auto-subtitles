# Troubleshooting

Use this page when the panel opens but captions, timing, or AE layer creation does not behave as expected.

## Panel Does Not Appear

1. Restart After Effects after installation.
2. Open `Window -> Extensions -> AED Subtitles`.
3. Confirm the extension exists:

```text
$HOME/Library/Application Support/Adobe/CEP/extensions/com.airliner.aeautosubtitles
```

## Run Does Nothing

Enable AE scripting access:

```text
After Effects -> Settings -> Scripting & Expressions -> Allow Scripts to Write Files and Access Network
```

Restart After Effects after changing this setting.

## First Transcription Is Slow

The first Turbo run may download the model if it was not bundled in the installer. Later runs use the local cache.

## Captions Are Shifted

1. Keep `Active comp mix` selected.
2. Press `Rescan`.
3. Press `Retiming`.
4. Review captions before pressing `Run`.

This matters after changing the model, composition audio, selected source, or reference text.

## Captions Look Like Tiny Timeline Shards

This usually means the timing pass created impossible durations. Use the comp mix path and regenerate timings:

1. Select `Active comp mix`.
2. Press `Rescan`.
3. Press `Retiming`.
4. Review captions.
5. Press `Run`.

## Reference Text Is Correct But Timing Is Wrong

Reference text fixes words; it does not automatically prove timing is still valid after composition changes. Run `Retiming` before applying layers.

## Reference Text Creates Blocks That Are Too Long

Reference text is split using the same layout controls shown beside the preview:

- lower `Max Chars` to make shorter caption blocks
- lower `Max Lines` to prevent tall blocks
- adjust `Block Width` to change wrapping
- use `Block Scale` when the block shape is right but the rendered size needs to change

After changing these controls, review the caption list again before pressing `Run` or `Apply Changed`.

## Need Evidence

Use:

- `Copy Log` in the panel
- `Review Captions`
- `Native QA`
- `tmp/subtitles.json` for the current caption payload

## Native QA

Run from the panel, or from a terminal:

```bash
python "$HOME/Library/Application Support/Adobe/CEP/extensions/com.airliner.aeautosubtitles/scripts/native_qa.py"
```

If your AE runner is not in a default local path, set:

```bash
export AEAS_AE_RUNNER="/path/to/after-effects/scripts/runner.sh"
```
