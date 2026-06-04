import argparse
import math
import re
from dataclasses import dataclass, field
from typing import Any, Iterable

try:
    from .io_json import read_json, write_json
except ImportError:
    from io_json import read_json, write_json

FILLER_WORDS = {"uh", "um", "er", "ah", "eh", "like"}

DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
HINGLISH_WORD_OVERRIDES = {
    "अच्छा": "accha",
    "आप": "aap",
    "आना": "aana",
    "आने": "aane",
    "आया": "aaya",
    "और": "aur",
    "का": "ka",
    "कि": "ki",
    "की": "ki",
    "के": "ke",
    "को": "ko",
    "कोई": "koi",
    "क्या": "kya",
    "चांस": "chance",
    "तो": "to",
    "नहीं": "nahi",
    "निकला": "nikla",
    "पर": "par",
    "प्यार": "pyaar",
    "ब्रेकअप": "breakup",
    "कमेंट": "comment",
    "कीजिए": "kijiye",
    "कीजिये": "kijiye",
    "मुझे": "mujhe",
    "मेरे": "mere",
    "मौका": "mauka",
    "ये": "ye",
    "लगता": "lagta",
    "रिश्ता": "rishta",
    "वापस": "wapas",
    "वापिस": "wapis",
    "साथ": "saath",
    "सही": "sahi",
    "है": "hai",
    "हैं": "hain",
}
DEVANAGARI_VOWELS = {
    "अ": "a",
    "आ": "aa",
    "इ": "i",
    "ई": "ee",
    "उ": "u",
    "ऊ": "oo",
    "ऋ": "ri",
    "ए": "e",
    "ऐ": "ai",
    "ओ": "o",
    "औ": "au",
}
DEVANAGARI_MATRAS = {
    "ा": "aa",
    "ि": "i",
    "ी": "ee",
    "ु": "u",
    "ू": "oo",
    "ृ": "ri",
    "े": "e",
    "ै": "ai",
    "ो": "o",
    "ौ": "au",
}
DEVANAGARI_CONSONANTS = {
    "क": "k",
    "ख": "kh",
    "ग": "g",
    "घ": "gh",
    "ङ": "ng",
    "च": "ch",
    "छ": "chh",
    "ज": "j",
    "झ": "jh",
    "ञ": "ny",
    "ट": "t",
    "ठ": "th",
    "ड": "d",
    "ढ": "dh",
    "ण": "n",
    "त": "t",
    "थ": "th",
    "द": "d",
    "ध": "dh",
    "न": "n",
    "प": "p",
    "फ": "f",
    "ब": "b",
    "भ": "bh",
    "म": "m",
    "य": "y",
    "र": "r",
    "ल": "l",
    "व": "w",
    "श": "sh",
    "ष": "sh",
    "स": "s",
    "ह": "h",
    "ळ": "l",
}
DEVANAGARI_SIGNS = {"ं": "n", "ँ": "n", "ः": "h", "़": "", "ऽ": "", "।": ".", "॥": "."}


@dataclass
class Segment:
    start: float
    end: float
    text: str
    words: list["Word"] = field(default_factory=list)

    @property
    def duration(self) -> float:
        return max(0.0, self.end - self.start)


@dataclass
class Word:
    start: float
    end: float
    text: str


def _clean_text(text: str, strip_fillers: bool = False) -> str:
    value = re.sub(r"\s+", " ", (text or "").strip())
    if strip_fillers and value:
        value = re.sub(
            r"\b(" + "|".join(sorted(FILLER_WORDS)) + r")\b",
            "",
            value,
            flags=re.IGNORECASE,
        )
        value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"\s+([,.!?;:])", r"\1", value)
    return value


def _clean_word_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def _romanize_devanagari_token(token: str) -> str:
    override = HINGLISH_WORD_OVERRIDES.get(token)
    if override:
        return override

    out: list[str] = []
    idx = 0
    while idx < len(token):
        ch = token[idx]
        if ch in DEVANAGARI_CONSONANTS:
            base = DEVANAGARI_CONSONANTS[ch]
            next_ch = token[idx + 1] if idx + 1 < len(token) else ""
            if next_ch == "्":
                out.append(base)
                idx += 2
                continue
            if next_ch in DEVANAGARI_MATRAS:
                out.append(base + DEVANAGARI_MATRAS[next_ch])
                idx += 2
                continue
            out.append(base + "a")
        elif ch in DEVANAGARI_VOWELS:
            out.append(DEVANAGARI_VOWELS[ch])
        elif ch in DEVANAGARI_MATRAS:
            out.append(DEVANAGARI_MATRAS[ch])
        elif ch in DEVANAGARI_SIGNS:
            out.append(DEVANAGARI_SIGNS[ch])
        else:
            out.append(ch)
        idx += 1
    return "".join(out)


def romanize_hinglish_text(text: str) -> str:
    if not text or not DEVANAGARI_RE.search(text):
        return text

    def replace_token(match: re.Match[str]) -> str:
        return _romanize_devanagari_token(match.group(0))

    value = re.sub(r"[\u0900-\u097F]+", replace_token, text)
    return _clean_text(value)


def _raw_has_devanagari(raw_json: dict[str, Any] | list[dict[str, Any]]) -> bool:
    raw_items: Iterable[dict[str, Any]]
    if isinstance(raw_json, dict):
        raw_items = raw_json.get("items", [])
    elif isinstance(raw_json, list):
        raw_items = raw_json
    else:
        return False

    for item in raw_items:
        if not isinstance(item, dict):
            continue
        if DEVANAGARI_RE.search(str(item.get("text", ""))):
            return True
        for word in item.get("words", []) or []:
            if isinstance(word, dict) and DEVANAGARI_RE.search(str(word.get("text", ""))):
                return True
    return False


def _should_romanize_hinglish(
    raw_json: dict[str, Any] | list[dict[str, Any]],
    romanize_hinglish: bool | None,
) -> bool:
    if romanize_hinglish is not None:
        return bool(romanize_hinglish)
    if isinstance(raw_json, dict):
        language = str(raw_json.get("language") or "").strip().lower().replace("_", "-")
        if language in {"hi", "hindi", "hinglish", "hi-latn", "hi-latin"}:
            return True
    return _raw_has_devanagari(raw_json)


def _word_is_filler(text: str) -> bool:
    key = re.sub(r"^[^\wа-яіїєґñáéíóúü]+|[^\wа-яіїєґñáéíóúü]+$", "", (text or "").lower())
    return key in FILLER_WORDS


def _build_text_from_words(words: list[Word], fallback_text: str = "") -> str:
    if words:
        return _clean_text(" ".join(word.text for word in words))
    return _clean_text(fallback_text)


def _approximate_words(start: float, end: float, text: str) -> list[Word]:
    clean_text = _clean_text(text)
    parts = [part for part in clean_text.split() if part]
    if not parts:
        return []

    duration = max(0.01, end - start)
    out: list[Word] = []
    cursor = start
    total = len(parts)
    for idx, part in enumerate(parts):
        word_end = end if idx == total - 1 else start + (duration * (idx + 1) / total)
        if word_end <= cursor:
            word_end = cursor + 0.01
        out.append(Word(start=cursor, end=word_end, text=part))
        cursor = word_end

    if out:
        out[-1].end = max(out[-1].start + 0.01, end)
    return out


def _normalize_items(raw: Any, strip_fillers: bool = False) -> list[Segment]:
    raw_items: Iterable[dict[str, Any]]
    if isinstance(raw, dict):
        raw_items = raw.get("items", [])
    elif isinstance(raw, list):
        raw_items = raw
    else:
        raw_items = []

    segments: list[Segment] = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        try:
            start = float(item.get("start", 0.0))
        except (TypeError, ValueError):
            start = 0.0
        try:
            end = float(item.get("end", start))
        except (TypeError, ValueError):
            end = start

        if end <= start:
            end = start + 0.05

        text = _clean_text(str(item.get("text", "")), strip_fillers=strip_fillers)
        if not text:
            continue

        words: list[Word] = []
        for raw_word in item.get("words", []) or []:
            if not isinstance(raw_word, dict):
                continue
            try:
                word_start = float(raw_word.get("start", start))
            except (TypeError, ValueError):
                word_start = start
            try:
                word_end = float(raw_word.get("end", word_start))
            except (TypeError, ValueError):
                word_end = word_start
            if word_end <= word_start:
                word_end = word_start + 0.01

            word_text = _clean_word_text(str(raw_word.get("text", "")))
            if not word_text:
                continue
            if strip_fillers and _word_is_filler(word_text):
                continue
            words.append(Word(start=word_start, end=word_end, text=word_text))

        if not words:
            words = _approximate_words(start, end, text)

        text = _build_text_from_words(words, text)
        if not text:
            continue

        segments.append(Segment(start=start, end=end, text=text, words=words))

    segments.sort(key=lambda s: (s.start, s.end))
    return segments


def _merge_short_segments(
    items: list[Segment],
    min_dur: float,
    max_gap: float = 0.2,
    max_dur: float | None = None,
    max_text_chars: int | None = None,
) -> list[Segment]:
    if not items:
        return []

    merged: list[Segment] = []
    current = Segment(items[0].start, items[0].end, items[0].text, list(items[0].words))

    for nxt in items[1:]:
        gap = max(0.0, nxt.start - current.end)
        short_required = current.duration < min_dur or nxt.duration < min_dur
        should_merge = short_required and gap <= max_gap

        if should_merge:
            candidate_start = current.start
            candidate_end = max(current.end, nxt.end)
            candidate_words = list(current.words) + list(nxt.words)
            candidate_text = _build_text_from_words(candidate_words, f"{current.text} {nxt.text}")

            if max_dur is not None and (candidate_end - candidate_start) > max_dur:
                should_merge = False
            if max_text_chars is not None and len(candidate_text) > max_text_chars:
                should_merge = False

        if should_merge:
            current = Segment(candidate_start, candidate_end, candidate_text, candidate_words)
        else:
            merged.append(current)
            current = Segment(nxt.start, nxt.end, nxt.text, list(nxt.words))

    merged.append(current)

    if len(merged) >= 2 and merged[-1].duration < min_dur:
        prev = merged[-2]
        tail = merged[-1]
        candidate_words = list(prev.words) + list(tail.words)
        candidate_text = _build_text_from_words(candidate_words, f"{prev.text} {tail.text}")
        candidate_dur = max(tail.end, prev.end) - prev.start
        can_merge_tail = True
        if max_dur is not None and candidate_dur > max_dur:
            can_merge_tail = False
        if max_text_chars is not None and len(candidate_text) > max_text_chars:
            can_merge_tail = False

        if can_merge_tail:
            prev.end = tail.end
            prev.text = candidate_text
            prev.words = candidate_words
            merged.pop()

    return merged


def _split_long_segment(item: Segment, max_dur: float) -> list[Segment]:
    dur = item.duration
    if dur <= max_dur:
        return [item]

    words = list(item.words) if item.words else _approximate_words(item.start, item.end, item.text)
    if len(words) <= 1:
        parts_count = int(math.ceil(dur / max_dur))
        part_dur = dur / parts_count
        return [
            Segment(
                start=item.start + i * part_dur,
                end=item.start + (i + 1) * part_dur,
                text=item.text,
                words=list(words),
            )
            for i in range(parts_count)
        ]

    parts_count = int(math.ceil(dur / max_dur))
    chunk_size = int(math.ceil(len(words) / parts_count))
    chunks: list[list[Word]] = []
    for i in range(0, len(words), chunk_size):
        chunks.append(words[i : i + chunk_size])

    total_words = sum(len(c) for c in chunks)
    cursor = item.start
    out: list[Segment] = []
    for idx, chunk in enumerate(chunks):
        start = chunk[0].start if chunk else cursor
        if idx == len(chunks) - 1:
            end = item.end
        else:
            ratio = max(1, len(chunk)) / max(1, total_words)
            end = min(item.end, max(chunk[-1].end if chunk else cursor, cursor + dur * ratio))
        out.append(
            Segment(
                start=start,
                end=end,
                text=_build_text_from_words(chunk, item.text),
                words=list(chunk),
            )
        )
        cursor = end

    if out:
        out[-1].end = item.end
    return out


def _split_segment_by_text_capacity(
    item: Segment,
    max_chars_per_line: int,
    max_lines: int,
) -> list[Segment]:
    max_chars_per_segment = max_chars_per_line * max(1, max_lines)
    words = list(item.words) if item.words else _approximate_words(item.start, item.end, item.text)
    text = _build_text_from_words(words, item.text)
    if len(text) <= max_chars_per_segment:
        item.text = text
        item.words = words
        return [item]

    if not words:
        return [item]

    chunks: list[list[Word]] = []
    current: list[Word] = []
    current_len = 0
    for word in words:
        projected = current_len + (1 if current else 0) + len(word.text)
        if projected <= max_chars_per_segment or not current:
            current.append(word)
            current_len = projected
        else:
            chunks.append(list(current))
            current = [word]
            current_len = len(word.text)

    if current:
        chunks.append(list(current))

    if len(chunks) <= 1:
        return [item]

    out: list[Segment] = []

    for idx, chunk in enumerate(chunks):
        start = chunk[0].start
        end = chunk[-1].end if idx < len(chunks) - 1 else item.end
        if end <= start:
            end = start + 0.05
        out.append(
            Segment(
                start=start,
                end=end,
                text=_build_text_from_words(chunk, item.text),
                words=list(chunk),
            )
        )

    if out:
        out[-1].end = item.end
    return out


def _split_lines(text: str, max_chars_per_line: int, max_lines: int) -> list[str]:
    value = _clean_text(text)
    if not value:
        return []

    if max_lines <= 1:
        return [value]

    words = value.split()
    if not words:
        return [value]

    lines: list[str] = []
    current: list[str] = []
    current_len = 0

    idx = 0
    while idx < len(words):
        word = words[idx]
        projected = current_len + (1 if current else 0) + len(word)
        if projected <= max_chars_per_line or not current:
            current.append(word)
            current_len = projected
            idx += 1
            continue

        lines.append(" ".join(current))
        current = []
        current_len = 0

        if len(lines) >= max_lines - 1:
            remainder = " ".join(words[idx:])
            lines.append(remainder)
            return lines[:max_lines]

    if current:
        lines.append(" ".join(current))

    return lines[:max_lines]


def _fit_words_to_segment(words: list[Word], start: float, end: float, text: str) -> list[Word]:
    clean_words = [word for word in words if word.text]
    if not clean_words:
        return _approximate_words(start, end, text)

    duration = max(0.01, end - start)
    first = min(word.start for word in clean_words)
    last = max(word.end for word in clean_words)
    source_duration = max(0.01, last - first)
    fitted: list[Word] = []

    for word in clean_words:
        rel_start = max(0.0, word.start - first) / source_duration
        rel_end = max(rel_start, word.end - first) / source_duration
        word_start = start + (duration * rel_start)
        word_end = start + (duration * rel_end)
        if word_end <= word_start:
            word_end = word_start + 0.01
        fitted.append(
            Word(
                start=max(start, min(end - 0.01, word_start)),
                end=min(end, max(start + 0.01, word_end)),
                text=word.text,
            )
        )

    if fitted:
        fitted[0].start = start
        fitted[-1].end = end
    return fitted


def _clamp_words_to_segment(words: list[Word], start: float, end: float, text: str) -> list[Word]:
    clean_words = [word for word in words if word.text]
    if not clean_words:
        return _approximate_words(start, end, text)

    out: list[Word] = []
    cursor = start
    for word in clean_words:
        word_start = max(start, min(end - 0.01, word.start))
        word_start = max(cursor, word_start)
        word_end = min(end, max(word_start + 0.01, word.end))
        out.append(Word(start=word_start, end=word_end, text=word.text))
        cursor = word_end
    return out


def _prevent_timeline_overlaps(items: list[Segment], min_gap: float = 0.01) -> list[Segment]:
    if not items:
        return []

    ordered = sorted(items, key=lambda item: (item.start, item.end))
    out: list[Segment] = []
    cursor = 0.0

    for idx, item in enumerate(ordered):
        start = max(0.0, item.start, cursor)
        end = max(start + 0.01, item.end)
        next_start = None
        if idx + 1 < len(ordered):
            next_start = max(start, ordered[idx + 1].start)
            if end > next_start - min_gap:
                end = max(start + 0.01, next_start - min_gap)

        boundary_changed = abs(start - item.start) > 0.001 or abs(end - item.end) > 0.001
        if boundary_changed:
            words = _fit_words_to_segment(list(item.words), start, end, item.text)
        else:
            words = _clamp_words_to_segment(list(item.words), start, end, item.text)
        out.append(Segment(start=start, end=end, text=item.text, words=words))
        cursor = end + min_gap

    return out


def postprocess_subtitles(
    raw_json: dict[str, Any] | list[dict[str, Any]],
    *,
    max_chars_per_line: int = 42,
    max_lines: int = 2,
    min_dur: float = 0.35,
    max_dur: float = 4.5,
    strip_fillers: bool = False,
    romanize_hinglish: bool | None = None,
) -> dict[str, Any]:
    romanize_output = _should_romanize_hinglish(raw_json, romanize_hinglish)
    max_text_chars = max_chars_per_line * max(1, max_lines)
    items = _normalize_items(raw_json, strip_fillers=strip_fillers)
    items = _merge_short_segments(
        items,
        min_dur=min_dur,
        max_dur=max_dur,
        max_text_chars=max_text_chars,
    )

    expanded: list[Segment] = []
    for item in items:
        by_duration = _split_long_segment(item, max_dur=max_dur)
        for part in by_duration:
            expanded.extend(
                _split_segment_by_text_capacity(
                    part,
                    max_chars_per_line=max_chars_per_line,
                    max_lines=max_lines,
                )
            )

    items = _merge_short_segments(
        expanded,
        min_dur=min_dur,
        max_dur=max_dur,
        max_text_chars=max_text_chars,
    )

    final_items: list[Segment] = []
    for item in items:
        for part in _split_long_segment(item, max_dur=max_dur):
            final_items.extend(
                _split_segment_by_text_capacity(
                    part,
                    max_chars_per_line=max_chars_per_line,
                    max_lines=max_lines,
                )
            )
    items = final_items
    items = _prevent_timeline_overlaps(items)

    out_items: list[dict[str, Any]] = []
    for idx, item in enumerate(items, start=1):
        start = round(max(0.0, item.start), 3)
        end = round(max(start + 0.01, item.end), 3)
        text = _clean_text(item.text)
        if romanize_output:
            text = romanize_hinglish_text(text)
        if not text:
            continue
        lines = _split_lines(text, max_chars_per_line=max_chars_per_line, max_lines=max_lines)
        out_items.append(
            {
                "id": f"{idx:04d}",
                "start": start,
                "end": end,
                "text": text,
                "lines": lines or [text],
                "words": [
                    {
                        "start": round(max(start, word.start), 3),
                        "end": round(max(max(start, word.start) + 0.01, min(end, word.end)), 3),
                        "text": romanize_hinglish_text(word.text) if romanize_output else word.text,
                    }
                    for word in (item.words or _approximate_words(start, end, text))
                    if word.text
                ],
            }
        )

    language = raw_json.get("language") if isinstance(raw_json, dict) else None
    meta = {
        "max_chars_per_line": max_chars_per_line,
        "max_lines": max_lines,
        "min_dur": min_dur,
        "max_dur": max_dur,
    }
    if romanize_output:
        meta["output_script"] = "latin"
        meta["language_mode"] = "hinglish"
    return {
        "items": out_items,
        "language": "hinglish" if romanize_output else (language or "auto"),
        "meta": meta,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Postprocess raw subtitle items into readable subtitle blocks")
    parser.add_argument("--input", required=True, help="Path to raw transcription json")
    parser.add_argument("--out", required=True, help="Output subtitles json")
    parser.add_argument("--max_chars", type=int, default=42, help="Max characters per line")
    parser.add_argument("--max_lines", type=int, default=2, help="Max lines per subtitle")
    parser.add_argument("--min_dur", type=float, default=0.35, help="Minimum subtitle duration in seconds")
    parser.add_argument("--max_dur", type=float, default=4.5, help="Maximum subtitle duration in seconds")
    parser.add_argument(
        "--strip_fillers",
        action="store_true",
        help="Remove common filler words (uh/um/etc.)",
    )
    parser.add_argument(
        "--romanize_hinglish",
        action="store_true",
        help="Output Hindi/Hinglish Devanagari text as Latin letters.",
    )

    args = parser.parse_args()
    raw = read_json(args.input)
    out = postprocess_subtitles(
        raw,
        max_chars_per_line=args.max_chars,
        max_lines=args.max_lines,
        min_dur=args.min_dur,
        max_dur=args.max_dur,
        strip_fillers=args.strip_fillers,
        romanize_hinglish=args.romanize_hinglish,
    )
    write_json(out, args.out)

    print(f"Wrote {len(out.get('items', []))} subtitle items -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
