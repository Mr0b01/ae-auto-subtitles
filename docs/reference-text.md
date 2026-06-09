# Reference Text

Reference Text is the correction layer for cases where Whisper hears the rhythm but not the exact words.

Use it when:

- Hinglish / Indo-English needs to stay in Latin letters
- names, offers, product terms, or slang are misheard
- Whisper skips a spoken phrase
- you already know the exact sentence that should appear in the captions
- you want to update only captions that differ from the model output

## How It Works

```text
Whisper transcript
  -> word/timing slots
  -> paste known-correct reference text
  -> align reference words against model words
  -> fill missed gaps where possible
  -> mark model/reference differences
  -> review before AE layers are created
```

Reference Text does not simply replace captions from left to right. It compares normalized model words with normalized reference words, keeps timing from the transcript where possible, and creates reference-filled captions when Whisper missed a gap.

## What Review Captions Shows

Review Captions is the source-of-truth screen before `Run`.

| Label | Meaning |
| --- | --- |
| `Model` | Text still comes from Whisper. |
| `Reference match` | Whisper text matched the reference text. |
| `Reference` | Text was corrected or filled from the pasted reference. |
| `Reference gap` | Whisper missed a timed span and the plugin filled it from reference text. |

The footer also summarizes how many captions are reference-linked, changed, and model-only.

## Apply Changed

Use `Apply Changed` when you already have subtitle layers and only want to update the captions that changed after a reference pass.

This is useful when:

- most layers are already approved
- only a few words were corrected
- you do not want to rebuild unchanged subtitle layers

`Apply Changed` writes a changed-caption patch and applies only captions whose current text differs from the original model text.

## Block And Layout Controls

Reference text is still shaped by the caption layout controls.

| Control | What it changes |
| --- | --- |
| `Max Chars` | Maximum text length before the caption is split/wrapped. |
| `Max Lines` | Maximum line count inside one caption block. |
| `Block Width` | Width used to wrap words into the preview/render block. |
| `Block Scale` | Visual scale of the formed block without rewriting the words. |
| `Offset X/Y` | Where the caption block sits in the comp. |

When pasted reference text is longer than the model caption, AED Subtitles can split oversized reference assignments into multiple caption blocks so a single caption does not become unreadable.

## Recommended Flow

1. Press `Scan` or `Rescan`.
2. Run `Retiming` when audio/model/source changed.
3. Open `Review Captions`.
4. Paste the known-correct reference text.
5. Check labels: `Model`, `Reference`, `Reference gap`, and changed counts.
6. Adjust `Max Chars`, `Max Lines`, `Block Width`, and `Block Scale`.
7. Use `Run` for a full apply, or `Apply Changed` for changed captions only.

## Limits

Reference Text can correct wording and fill some missed gaps, but it still depends on usable timing. If the audio, model, or comp changed, run `Retiming` before applying layers.
