import argparse
import json
import logging
import math
import os
import re
import shutil
import subprocess
import wave
from collections import Counter
from pathlib import Path
from typing import Any

try:
    from .io_json import write_json
    from .postprocess import postprocess_subtitles
except ImportError:
    from io_json import write_json
    from postprocess import postprocess_subtitles


class PipelineError(RuntimeError):
    pass


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _bundled_runtime_dir() -> Path:
    return _repo_root() / "runtime"


def setup_logger(log_dir: str | Path) -> logging.Logger:
    target = Path(log_dir).expanduser()
    target.mkdir(parents=True, exist_ok=True)
    log_path = target / "ae_auto_subtitles.log"

    logger = logging.getLogger("ae_auto_subtitles")
    logger.setLevel(logging.INFO)
    logger.handlers = []

    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")

    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    return logger


def _is_wav(path: str | Path) -> bool:
    return Path(path).suffix.lower() == ".wav"


def _audio_duration_seconds(path: str | Path) -> float | None:
    path = Path(path)
    if _is_wav(path):
        try:
            with wave.open(str(path), "rb") as wav:
                rate = wav.getframerate()
                if rate <= 0:
                    return None
                return wav.getnframes() / float(rate)
        except (OSError, wave.Error):
            return None
    return None


def _ensure_ffmpeg() -> str:
    env_path = (os.environ.get("AEAS_FFMPEG_BIN") or "").strip()
    if env_path:
        env_bin = Path(env_path).expanduser()
        if env_bin.exists() and env_bin.is_file():
            return str(env_bin)

    local_ffmpeg = _repo_root() / "ffmpeg"
    if local_ffmpeg.exists() and local_ffmpeg.is_file():
        return str(local_ffmpeg)

    ffmpeg_binary = (os.environ.get("FFMPEG_BINARY") or "").strip()
    if ffmpeg_binary:
        env_bin = Path(ffmpeg_binary).expanduser()
        if env_bin.exists() and env_bin.is_file():
            return str(env_bin)

    bundled_ffmpeg = _bundled_runtime_dir() / "bin" / "ffmpeg"
    if bundled_ffmpeg.exists() and bundled_ffmpeg.is_file():
        return str(bundled_ffmpeg)

    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        raise PipelineError(
            "ffmpeg is not installed or not found in PATH. Install ffmpeg first and retry."
        )
    return ffmpeg_bin


def emit_progress(percent: int, message: str) -> None:
    print(f"AEAS_PROGRESS {percent} {message}", flush=True)


def _to_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _model_dir_has_required_files(model_dir: Path) -> bool:
    required = ("model.bin", "config.json", "tokenizer.json", "vocabulary.txt")
    return all((model_dir / name).is_file() for name in required)


def _repair_hf_symlink_model(model_dir: Path, logger: logging.Logger | None = None) -> bool:
    required = ("model.bin", "config.json", "tokenizer.json", "vocabulary.txt")
    runtime_blobs_dir = model_dir.parent.parent / "blobs"
    cache_model_dir_name = "models--Systran--" + str(model_dir.name or "").replace("-", "--")
    hf_cache_blobs_dir = (
        Path.home() / ".cache" / "huggingface" / "hub" / cache_model_dir_name / "blobs"
    )

    changed = False
    for name in required:
        link_path = model_dir / name
        if link_path.is_file():
            continue
        if not link_path.is_symlink():
            continue

        try:
            target = os.readlink(link_path)
        except OSError:
            continue

        match = re.match(r"^\.\./\.\./blobs/([a-fA-F0-9]+)$", target)
        if not match:
            continue

        blob_name = match.group(1)
        runtime_blob = runtime_blobs_dir / blob_name
        if runtime_blob.is_file():
            continue

        source_blob = hf_cache_blobs_dir / blob_name
        if not source_blob.is_file():
            continue

        runtime_blobs_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_blob, runtime_blob)
        changed = True
        if logger:
            logger.info("Recovered missing model blob '%s' from Hugging Face cache", blob_name)

    return changed and _model_dir_has_required_files(model_dir)


def extract_audio(
    input_video: str | Path,
    out_wav: str | Path,
    *,
    sr: int = 16000,
    mono: bool = True,
    clip_start: float | None = None,
    clip_duration: float | None = None,
    logger: logging.Logger | None = None,
) -> Path:
    input_video = Path(input_video)
    out_wav = Path(out_wav)

    if not input_video.exists():
        raise PipelineError(f"Input video not found: {input_video}")

    ffmpeg_bin = _ensure_ffmpeg()
    out_wav.parent.mkdir(parents=True, exist_ok=True)

    channels = "1" if mono else "2"
    cmd: list[str] = [ffmpeg_bin, "-y"]

    if clip_start is not None and clip_start > 0:
        cmd.extend(["-ss", f"{clip_start:.3f}"])

    cmd.extend(["-i", str(input_video)])

    if clip_duration is not None and clip_duration > 0:
        cmd.extend(["-t", f"{clip_duration:.3f}"])

    cmd.extend(["-vn", "-ac", channels, "-ar", str(sr), str(out_wav)])

    if logger:
        logger.info("Running extract_audio: %s", " ".join(cmd))
    emit_progress(18, "Extracting audio...")

    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        if logger:
            logger.error("ffmpeg failed: %s", proc.stderr.strip())
        raise PipelineError(f"ffmpeg extract failed (exit {proc.returncode}): {proc.stderr.strip()}")

    if not out_wav.exists() or out_wav.stat().st_size == 0:
        raise PipelineError(f"WAV extraction failed: output is missing/empty ({out_wav})")

    if logger:
        logger.info("Audio extracted: %s", out_wav)
    emit_progress(35, "Audio extracted")
    return out_wav


def _logprob_to_confidence(avg_logprob: float) -> float:
    conf = math.exp(avg_logprob)
    return max(0.0, min(1.0, conf))


def transcribe_wav(
    input_wav: str | Path,
    *,
    language: str = "auto",
    model_name: str = "turbo",
    model_dir: str = "",
    device: str = "cpu",
    compute_type: str = "int8",
    vad_filter: bool = False,
    beam_size: int = 5,
    best_of: int = 5,
    no_speech_threshold: float = 0.85,
    chunk_seconds: float = 15.0,
    chunk_overlap: float = 1.5,
    logger: logging.Logger | None = None,
) -> dict[str, Any]:
    input_wav = Path(input_wav)
    if not input_wav.exists():
        raise PipelineError(f"Input wav not found: {input_wav}")

    try:
        from faster_whisper import WhisperModel
    except Exception as exc:
        raise PipelineError(
            "Missing dependency: faster-whisper. Install requirements.txt and retry."
        ) from exc

    lang = None if language in {"auto", "", None} else language

    def _use_local_model_or_raise(candidate: Path, label: str) -> tuple[str, bool]:
        if _model_dir_has_required_files(candidate):
            return str(candidate), True
        if _repair_hf_symlink_model(candidate, logger):
            return str(candidate), True
        raise PipelineError(
            f"{label} model directory is incomplete: {candidate}. "
            "Required files: model.bin, config.json, tokenizer.json, vocabulary.txt"
        )

    resolved_model = model_name
    local_only = False
    if model_dir:
        model_path = Path(model_dir).expanduser()
        if model_path.exists():
            resolved_model, local_only = _use_local_model_or_raise(model_path, "Configured")
    elif Path(model_name).expanduser().exists():
        resolved_model, local_only = _use_local_model_or_raise(
            Path(model_name).expanduser(),
            "Local",
        )
    else:
        bundled_model = _bundled_runtime_dir() / "models" / f"faster-whisper-{model_name}"
        if bundled_model.exists():
            try:
                resolved_model, local_only = _use_local_model_or_raise(
                    bundled_model,
                    "Bundled",
                )
            except PipelineError:
                if logger:
                    logger.warning(
                        "Bundled model is incomplete at '%s'; falling back to downloadable model '%s'",
                        bundled_model,
                        model_name,
                    )
                resolved_model = model_name
                local_only = False

    if logger:
        logger.info(
            "Loading model '%s' (device=%s, compute_type=%s)",
            resolved_model,
            device,
            compute_type,
        )
    emit_progress(52, "Loading STT model...")

    try:
        model = WhisperModel(
            resolved_model,
            device=device,
            compute_type=compute_type,
            local_files_only=local_only,
        )
    except Exception as exc:
        raise PipelineError(f"Unable to load Whisper model '{resolved_model}': {exc}") from exc

    transcribe_options = {
        "language": lang,
        "vad_filter": vad_filter,
        "word_timestamps": True,
        "beam_size": max(1, int(beam_size or 1)),
        "best_of": max(1, int(best_of or 1)),
        "no_speech_threshold": max(0.0, min(1.0, float(no_speech_threshold))),
        "condition_on_previous_text": True,
    }

    items: list[dict[str, Any]] = []

    def append_segments(segments: Any) -> None:
        for seg in segments:
            text = (getattr(seg, "text", "") or "").strip()
            if not text:
                continue
            avg_logprob = float(getattr(seg, "avg_logprob", -1.2))
            words_payload: list[dict[str, Any]] = []
            for raw_word in getattr(seg, "words", []) or []:
                word_text = str(getattr(raw_word, "word", "") or "").strip()
                if not word_text:
                    continue
                word_start = round(float(getattr(raw_word, "start", getattr(seg, "start", 0.0))), 3)
                word_end = round(float(getattr(raw_word, "end", getattr(seg, "end", word_start))), 3)
                if word_end <= word_start:
                    word_end = round(word_start + 0.01, 3)
                words_payload.append(
                    {
                        "start": word_start,
                        "end": word_end,
                        "text": word_text,
                        "confidence": round(_to_float(getattr(raw_word, "probability", None), 0.0), 3),
                    }
                )
            items.append(
                {
                    "start": round(float(getattr(seg, "start", 0.0)), 3),
                    "end": round(float(getattr(seg, "end", 0.0)), 3),
                    "text": text,
                    "confidence": round(_logprob_to_confidence(avg_logprob), 3),
                    "words": words_payload,
                }
            )

    duration = _audio_duration_seconds(input_wav)
    chunk_len = max(0.0, float(chunk_seconds or 0.0))
    overlap = max(0.0, min(float(chunk_overlap or 0.0), max(0.0, chunk_len - 0.1)))

    info = None
    if duration and chunk_len > 0 and duration > chunk_len + overlap:
        if logger:
            logger.info(
                "Transcribing in chunks: duration=%.2fs chunk=%.2fs overlap=%.2fs",
                duration,
                chunk_len,
                overlap,
            )
        cursor = 0.0
        while cursor < duration:
            end = min(duration, cursor + chunk_len)
            segments, info = model.transcribe(
                str(input_wav),
                clip_timestamps=[round(cursor, 3), round(end, 3)],
                **transcribe_options,
            )
            append_segments(segments)
            if end >= duration:
                break
            cursor = max(cursor + 0.1, end - overlap)
        items = _dedupe_items(items)
    else:
        segments, info = model.transcribe(str(input_wav), **transcribe_options)
        append_segments(segments)

    detected_language = getattr(info, "language", None) if info else None
    detected_language = detected_language or language or "auto"
    if logger:
        logger.info("Transcription done. items=%d language=%s", len(items), detected_language)
    emit_progress(74, "Transcription done")

    result = {
        "items": items,
        "language": detected_language,
    }

    if not items and logger:
        logger.warning("No speech detected")

    return result


def _resolve_input_to_wav(
    input_path: str | Path,
    wav_out: str | Path,
    *,
    sr: int,
    mono: bool,
    logger: logging.Logger,
) -> Path:
    if _is_wav(input_path):
        return Path(input_path)
    return extract_audio(input_path, wav_out, sr=sr, mono=mono, logger=logger)


def _parse_sources_json(sources_json: str) -> list[dict[str, Any]]:
    if not sources_json:
        return []

    try:
        raw = json.loads(sources_json)
    except json.JSONDecodeError as exc:
        raise PipelineError(f"Invalid --sources_json: {exc}") from exc

    if isinstance(raw, dict):
        raw = raw.get("sources", [])

    if not isinstance(raw, list):
        raise PipelineError("--sources_json must be a JSON array")

    out: list[dict[str, Any]] = []
    for idx, item in enumerate(raw):
        if not isinstance(item, dict):
            continue

        path = str(item.get("path") or item.get("filePath") or "").strip()
        if not path:
            continue

        in_point = _to_float(item.get("inPoint"), 0.0)
        out_point_raw = item.get("outPoint")
        out_point = _to_float(out_point_raw, in_point)
        start_time = _to_float(item.get("startTime"), 0.0)
        layer_name = str(item.get("layerName") or f"source_{idx + 1}")

        if out_point <= in_point:
            out_point = in_point

        out.append(
            {
                "path": path,
                "layerName": layer_name,
                "inPoint": in_point,
                "outPoint": out_point,
                "startTime": start_time,
            }
        )

    return out


def _dedupe_key(text: str) -> str:
    value = re.sub(r"\s+", " ", (text or "").strip().lower())
    value = re.sub(r"[^a-z0-9\u0900-\u097Fа-яіїєґñáéíóúü\s]", "", value)
    return value.strip()


def _overlap_ratio(a: dict[str, Any], b: dict[str, Any]) -> float:
    a_start = _to_float(a.get("start"), 0.0)
    a_end = _to_float(a.get("end"), a_start)
    b_start = _to_float(b.get("start"), 0.0)
    b_end = _to_float(b.get("end"), b_start)

    inter = max(0.0, min(a_end, b_end) - max(a_start, b_start))
    if inter <= 0:
        return 0.0

    a_dur = max(0.001, a_end - a_start)
    b_dur = max(0.001, b_end - b_start)
    return inter / min(a_dur, b_dur)


def _dedupe_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not items:
        return []

    kept: list[dict[str, Any]] = []
    for item in items:
        item_key = _dedupe_key(str(item.get("text", "")))
        if not item_key:
            kept.append(item)
            continue

        duplicate_idx = -1
        keep_existing_duplicate = False
        for idx in range(max(0, len(kept) - 8), len(kept)):
            existing = kept[idx]
            existing_dur = _to_float(existing.get("end"), 0.0) - _to_float(existing.get("start"), 0.0)
            item_dur = _to_float(item.get("end"), 0.0) - _to_float(item.get("start"), 0.0)
            shorter = max(0.0, min(existing_dur, item_dur))
            longer = max(0.001, max(existing_dur, item_dur))
            if shorter > 0 and shorter / longer <= 0.6 and _overlap_ratio(existing, item) >= 0.72:
                duplicate_idx = idx
                keep_existing_duplicate = item_dur <= existing_dur
                break

            existing_key = _dedupe_key(str(existing.get("text", "")))
            if item_key != existing_key:
                continue

            if abs(_to_float(existing.get("start"), 0.0) - _to_float(item.get("start"), 0.0)) > 0.35:
                continue

            if _overlap_ratio(existing, item) < 0.5:
                continue

            duplicate_idx = idx
            break

        if duplicate_idx == -1:
            kept.append(item)
            continue

        if keep_existing_duplicate:
            continue

        existing = kept[duplicate_idx]
        existing_dur = _to_float(existing.get("end"), 0.0) - _to_float(existing.get("start"), 0.0)
        item_dur = _to_float(item.get("end"), 0.0) - _to_float(item.get("start"), 0.0)
        existing_conf = _to_float(existing.get("confidence"), 0.0)
        item_conf = _to_float(item.get("confidence"), 0.0)

        if (item_conf > existing_conf + 0.02) or (item_dur > existing_dur + 0.05):
            kept[duplicate_idx] = item

    kept.sort(key=lambda x: (_to_float(x.get("start"), 0.0), _to_float(x.get("end"), 0.0)))
    return kept


def _fit_word_timings_to_item(item: dict[str, Any]) -> None:
    words = item.get("words")
    if not isinstance(words, list) or not words:
        return

    start = _to_float(item.get("start"), 0.0)
    end = _to_float(item.get("end"), start)
    if end <= start:
        end = start + 0.01

    valid_words = [word for word in words if isinstance(word, dict) and str(word.get("text", "")).strip()]
    if not valid_words:
        item["words"] = []
        return

    first = min(
        min(_to_float(word.get("start"), start), _to_float(word.get("end"), start))
        for word in valid_words
    )
    last = max(_to_float(word.get("end"), end) for word in valid_words)
    source_duration = max(0.01, last - first)
    fitted: list[dict[str, Any]] = []
    cursor = start

    for idx, word in enumerate(valid_words):
        word_start = _to_float(word.get("start"), first)
        word_end = _to_float(word.get("end"), word_start)
        rel_start = max(0.0, word_start - first) / source_duration
        rel_end = max(rel_start, word_end - first) / source_duration
        next_start = start + ((end - start) * rel_start)
        next_end = start + ((end - start) * rel_end)
        if idx == 0:
            next_start = start
        if idx == len(valid_words) - 1:
            next_end = end
        next_start = max(cursor, min(end - 0.01, next_start))
        next_end = min(end, max(next_start + 0.01, next_end))
        fitted.append(
            {
                "start": round(next_start, 3),
                "end": round(next_end, 3),
                "text": str(word.get("text", "")).strip(),
                "confidence": round(_to_float(word.get("confidence"), 0.0), 3),
            }
        )
        cursor = next_end

    item["words"] = fitted


_TEXT_WORD_RE = re.compile(r"[A-Za-z0-9А-Яа-яІіЇїЄєҐґ\u0900-\u097F]+")


def _text_word_count(text: str) -> int:
    return len(_TEXT_WORD_RE.findall(str(text or "")))


def _is_punctuation_only(text: str) -> bool:
    return _text_word_count(text) == 0


def _is_implausible_dense_caption(item: dict[str, Any]) -> bool:
    text = str(item.get("text", "") or "")
    if _is_punctuation_only(text):
        return True

    word_count = max(_text_word_count(text), len(item.get("words") or []))
    if word_count < 4:
        return False

    start = _to_float(item.get("start"), 0.0)
    end = _to_float(item.get("end"), start)
    duration = max(0.0, end - start)

    # Faster-whisper can hallucinate a long phrase in a few frames when a
    # montage clip contains silence/music instead of voice. Those segments
    # create one-frame subtitle shards in AE, so drop them before postprocess.
    return duration < max(0.25, word_count * 0.075)


def _stabilize_timeline_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not items:
        return []

    items.sort(key=lambda x: (_to_float(x.get("start"), 0.0), _to_float(x.get("end"), 0.0)))
    frame_gap = 0.01
    stabilized: list[dict[str, Any]] = []

    for item in items:
        start = _to_float(item.get("start"), 0.0)
        end = _to_float(item.get("end"), start)
        if end <= start:
            end = start + 0.05
        item["start"] = round(max(0.0, start), 3)
        item["end"] = round(max(item["start"] + 0.01, end), 3)
        if _is_implausible_dense_caption(item):
            continue

        if stabilized:
            prev = stabilized[-1]
            prev_start = _to_float(prev.get("start"), 0.0)
            prev_end = _to_float(prev.get("end"), prev_start)
            current_start = _to_float(item.get("start"), 0.0)
            current_end = _to_float(item.get("end"), current_start)
            if current_start < prev_end - frame_gap:
                boundary = max(
                    prev_start + 0.05,
                    min(current_end - 0.05, (prev_end + current_start) / 2.0),
                )
                prev["end"] = round(boundary - frame_gap, 3)
                item["start"] = round(boundary, 3)
                if _to_float(prev.get("end"), prev_start) <= prev_start:
                    prev["end"] = round(prev_start + 0.05, 3)
                if _to_float(item.get("end"), current_end) <= _to_float(item.get("start"), 0.0):
                    item["end"] = round(_to_float(item.get("start"), 0.0) + 0.05, 3)
                _fit_word_timings_to_item(prev)

        _fit_word_timings_to_item(item)
        stabilized.append(item)

    return stabilized


def _detect_language(languages: list[str], requested_language: str) -> str:
    if requested_language and requested_language != "auto":
        return requested_language

    clean = [x for x in languages if x and x != "auto"]
    if not clean:
        return "auto"
    return Counter(clean).most_common(1)[0][0]


def _is_hinglish_mode(language: str | None) -> bool:
    value = str(language or "").strip().lower().replace("_", "-")
    return value in {"hinglish", "indo-english", "indian-english", "hi-latn", "hi-latin"}


def _recognition_language(language: str | None) -> str:
    if _is_hinglish_mode(language):
        return "hi"
    return str(language or "auto")


def _display_language(language: str | None) -> str:
    if _is_hinglish_mode(language):
        return "hinglish"
    return str(language or "auto")


def run_full_sources(
    sources: list[dict[str, Any]],
    *,
    wav_out: str | Path,
    raw_out: str | Path,
    subtitles_out: str | Path,
    language: str,
    model_name: str,
    model_dir: str,
    device: str,
    compute_type: str,
    vad_filter: bool,
    beam_size: int,
    best_of: int,
    no_speech_threshold: float,
    chunk_seconds: float,
    chunk_overlap: float,
    clip_pad: float,
    max_chars: int,
    max_lines: int,
    min_dur: float,
    max_dur: float,
    strip_fillers: bool,
    sr: int,
    mono: bool,
    logger: logging.Logger,
) -> dict[str, Any]:
    if not sources:
        raise PipelineError("No source items were provided via --sources_json")

    recognition_language = _recognition_language(language)
    display_language = _display_language(language)
    tmp_dir = Path(wav_out).parent
    tmp_dir.mkdir(parents=True, exist_ok=True)

    def _run_sources_pass(*, use_clip_ranges: bool) -> tuple[list[dict[str, Any]], list[str], int]:
        pass_items: list[dict[str, Any]] = []
        pass_languages: list[str] = []
        pass_processed = 0

        for idx, source in enumerate(sources, start=1):
            src_path = Path(str(source.get("path", "")))
            if not src_path.exists():
                if logger:
                    logger.warning("Skipping missing source file: %s", src_path)
                continue

            in_point = _to_float(source.get("inPoint"), 0.0)
            out_point = _to_float(source.get("outPoint"), in_point)
            start_time = _to_float(source.get("startTime"), 0.0)

            clip_start: float | None = None
            clip_duration: float | None = None
            timeline_shift = start_time

            if use_clip_ranges:
                source_window_start = max(0.0, in_point - start_time)
                padded_source_start = max(0.0, source_window_start - max(0.0, clip_pad))
                timeline_shift = start_time + padded_source_start
                clip_start = padded_source_start
                if out_point > in_point:
                    clip_duration = (out_point - in_point) + (source_window_start - padded_source_start) + max(0.0, clip_pad)

            wav_name = f"audio_src_{idx:02d}.wav" if use_clip_ranges else f"audio_src_{idx:02d}_full.wav"
            wav_path = tmp_dir / wav_name

            extract_audio(
                src_path,
                wav_path,
                sr=sr,
                mono=mono,
                clip_start=clip_start,
                clip_duration=clip_duration,
                logger=logger,
            )

            raw = transcribe_wav(
                wav_path,
                language=recognition_language,
                model_name=model_name,
                model_dir=model_dir,
                device=device,
                compute_type=compute_type,
                vad_filter=vad_filter,
                beam_size=beam_size,
                best_of=best_of,
                no_speech_threshold=no_speech_threshold,
                chunk_seconds=chunk_seconds,
                chunk_overlap=chunk_overlap,
                logger=logger,
            )

            pass_languages.append(str(raw.get("language") or "auto"))

            for item in raw.get("items", []):
                start = _to_float(item.get("start"), 0.0) + timeline_shift
                end = _to_float(item.get("end"), 0.0) + timeline_shift
                if end <= start:
                    end = start + 0.05
                if use_clip_ranges:
                    if end < in_point - 0.05 or start > out_point + 0.05:
                        continue
                    start = max(start, in_point)
                    end = min(end, out_point) if out_point > in_point else end
                    if end <= start:
                        end = start + 0.05

                shifted_words: list[dict[str, Any]] = []
                for word in item.get("words", []) or []:
                    if not isinstance(word, dict):
                        continue
                    word_start = _to_float(word.get("start"), 0.0) + timeline_shift
                    word_end = _to_float(word.get("end"), word_start) + timeline_shift
                    if word_end <= word_start:
                        word_end = word_start + 0.01
                    if use_clip_ranges:
                        if word_end < in_point - 0.05 or word_start > out_point + 0.05:
                            continue
                        word_start = max(word_start, in_point)
                        word_end = min(word_end, out_point) if out_point > in_point else word_end
                        if word_end <= word_start:
                            word_end = word_start + 0.01
                    word_text = str(word.get("text", "")).strip()
                    if not word_text:
                        continue
                    shifted_words.append(
                        {
                            "start": round(word_start, 3),
                            "end": round(word_end, 3),
                            "text": word_text,
                            "confidence": round(_to_float(word.get("confidence"), 0.0), 3),
                        }
                    )

                timeline_item = {
                    "start": round(start, 3),
                    "end": round(end, 3),
                    "text": str(item.get("text", "")).strip(),
                    "confidence": round(_to_float(item.get("confidence"), 0.0), 3),
                    "words": shifted_words,
                    "source": str(src_path),
                    "layer": str(source.get("layerName") or f"source_{idx}"),
                }
                if _is_implausible_dense_caption(timeline_item):
                    if logger:
                        logger.info(
                            "Skipping implausible dense transcript item: %.3f-%.3f %s",
                            timeline_item["start"],
                            timeline_item["end"],
                            timeline_item["text"][:120],
                        )
                    continue
                pass_items.append(timeline_item)

            pass_processed += 1

        return pass_items, pass_languages, pass_processed

    merged_items, languages, processed_sources = _run_sources_pass(use_clip_ranges=True)

    if processed_sources == 0:
        raise PipelineError("No valid source files found on timeline (with readable file path)")

    merged_items = [x for x in merged_items if x.get("text")]
    if not merged_items:
        if logger:
            logger.warning(
                "No speech detected in clipped timeline ranges. Retrying full source files."
            )
        merged_items, languages, processed_sources = _run_sources_pass(use_clip_ranges=False)

    merged_items = [x for x in merged_items if x.get("text")]
    merged_items.sort(key=lambda x: (_to_float(x.get("start"), 0.0), _to_float(x.get("end"), 0.0)))
    merged_items = _dedupe_items(merged_items)
    merged_items = _stabilize_timeline_items(merged_items)

    raw_payload = {
        "items": merged_items,
        "language": display_language if _is_hinglish_mode(language) else _detect_language(languages, language),
        "meta": {
            "sources_count": processed_sources,
            "dedupe": "text+time-overlap",
            "recognition_language": recognition_language,
            "language_mode": display_language,
            "clip_pad": max(0.0, clip_pad),
            "chunk_seconds": max(0.0, chunk_seconds),
            "chunk_overlap": max(0.0, chunk_overlap),
        },
    }
    write_json(raw_payload, raw_out)

    subs = postprocess_subtitles(
        raw_payload,
        max_chars_per_line=max_chars,
        max_lines=max_lines,
        min_dur=min_dur,
        max_dur=max_dur,
        strip_fillers=strip_fillers,
        romanize_hinglish=None,
    )
    write_json(subs, subtitles_out)

    if logger:
        logger.info(
            "full_run_sources completed: sources=%d raw=%s subtitles=%s",
            processed_sources,
            raw_out,
            subtitles_out,
        )
    emit_progress(88, "Backend done, creating subtitles in AE...")

    return {
        "raw_json": str(raw_out),
        "subtitles_json": str(subtitles_out),
        "items": len(subs.get("items", [])),
        "language": subs.get("language", "auto"),
        "sources": processed_sources,
    }


def run_full(
    input_path: str | Path,
    *,
    wav_out: str | Path,
    raw_out: str | Path,
    subtitles_out: str | Path,
    language: str,
    model_name: str,
    model_dir: str,
    device: str,
    compute_type: str,
    vad_filter: bool,
    beam_size: int,
    best_of: int,
    no_speech_threshold: float,
    chunk_seconds: float,
    chunk_overlap: float,
    max_chars: int,
    max_lines: int,
    min_dur: float,
    max_dur: float,
    strip_fillers: bool,
    sr: int,
    mono: bool,
    logger: logging.Logger,
) -> dict[str, Any]:
    wav_path = _resolve_input_to_wav(input_path, wav_out, sr=sr, mono=mono, logger=logger)
    recognition_language = _recognition_language(language)
    display_language = _display_language(language)

    raw = transcribe_wav(
        wav_path,
        language=recognition_language,
        model_name=model_name,
        model_dir=model_dir,
        device=device,
        compute_type=compute_type,
        vad_filter=vad_filter,
        beam_size=beam_size,
        best_of=best_of,
        no_speech_threshold=no_speech_threshold,
        chunk_seconds=chunk_seconds,
        chunk_overlap=chunk_overlap,
        logger=logger,
    )
    if _is_hinglish_mode(language):
        raw["language"] = display_language
        raw.setdefault("meta", {})
        raw["meta"]["recognition_language"] = recognition_language
        raw["meta"]["language_mode"] = display_language
    write_json(raw, raw_out)

    subs = postprocess_subtitles(
        raw,
        max_chars_per_line=max_chars,
        max_lines=max_lines,
        min_dur=min_dur,
        max_dur=max_dur,
        strip_fillers=strip_fillers,
        romanize_hinglish=None,
    )
    write_json(subs, subtitles_out)

    if logger:
        logger.info("full_run completed: raw=%s subtitles=%s", raw_out, subtitles_out)
    emit_progress(88, "Backend done, creating subtitles in AE...")

    return {
        "wav": str(wav_path),
        "raw_json": str(raw_out),
        "subtitles_json": str(subtitles_out),
        "items": len(subs.get("items", [])),
        "language": subs.get("language", "auto"),
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AE Auto-Subtitles backend pipeline")
    parser.add_argument("--input", help="Input video or wav path")
    parser.add_argument(
        "--sources_json",
        default="",
        help="JSON array of timeline sources [{path,inPoint,outPoint,startTime,layerName}, ...]",
    )
    parser.add_argument("--wav_out", default="tmp/audio.wav", help="Path for extracted wav")
    parser.add_argument("--out", default="tmp/raw.json", help="Path for raw transcript json")
    parser.add_argument(
        "--subtitles_out",
        default="tmp/subtitles.json",
        help="Path for postprocessed subtitles json",
    )

    parser.add_argument("--lang", default="auto", help="Language: auto|en|uk|es|hinglish")
    parser.add_argument("--model", default="turbo", help="faster-whisper model name")
    parser.add_argument("--model_dir", default="", help="Optional local model directory (offline mode)")
    parser.add_argument("--device", default="cpu", help="Inference device: cpu/cuda")
    parser.add_argument("--compute_type", default="int8", help="Compute type (int8/float16/etc.)")
    parser.add_argument(
        "--vad_filter",
        action="store_true",
        help="Enable faster-whisper VAD filtering. Off by default to avoid dropping quiet speech.",
    )
    parser.add_argument("--beam_size", type=int, default=5, help="Beam search size for accuracy")
    parser.add_argument("--best_of", type=int, default=5, help="Candidate count for decoding accuracy")
    parser.add_argument(
        "--no_speech_threshold",
        type=float,
        default=0.85,
        help="Higher values skip fewer uncertain speech segments.",
    )
    parser.add_argument(
        "--clip_pad",
        type=float,
        default=0.8,
        help="Seconds of source-audio padding around timeline clip ranges.",
    )
    parser.add_argument(
        "--chunk_seconds",
        type=float,
        default=15.0,
        help="Chunk long audio before recognition to avoid skipped middle phrases.",
    )
    parser.add_argument(
        "--chunk_overlap",
        type=float,
        default=1.5,
        help="Seconds of overlap between recognition chunks.",
    )

    parser.add_argument("--extract", action="store_true", help="Run only audio extraction")
    parser.add_argument("--transcribe_only", action="store_true", help="Run transcription only")
    parser.add_argument("--full_run", action="store_true", help="Run extract+transcribe+postprocess")

    parser.add_argument("--max_chars", type=int, default=42)
    parser.add_argument("--max_lines", type=int, default=2)
    parser.add_argument("--min_dur", type=float, default=0.35)
    parser.add_argument("--max_dur", type=float, default=4.5)
    parser.add_argument("--strip_fillers", action="store_true")

    parser.add_argument("--sr", type=int, default=16000)
    parser.add_argument("--mono", action="store_true", default=True)
    parser.add_argument(
        "--log_dir",
        default="~/Documents/ae_subtitles_logs",
        help="Directory for pipeline logs",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    logger = setup_logger(args.log_dir)

    try:
        sources = _parse_sources_json(args.sources_json)

        if not args.input and not sources:
            raise PipelineError("Provide either --input or --sources_json")

        input_path = Path(args.input) if args.input else None
        wav_out = Path(args.wav_out)
        raw_out = Path(args.out)
        subtitles_out = Path(args.subtitles_out)

        if args.extract and not args.transcribe_only and not args.full_run:
            if not input_path:
                raise PipelineError("--extract requires --input")
            wav_path = extract_audio(input_path, wav_out, sr=args.sr, mono=args.mono, logger=logger)
            print(f"extract_audio: {wav_path}")
            return 0

        if args.full_run:
            if sources:
                result = run_full_sources(
                    sources,
                    wav_out=wav_out,
                    raw_out=raw_out,
                    subtitles_out=subtitles_out,
                    language=args.lang,
                    model_name=args.model,
                    model_dir=args.model_dir,
                    device=args.device,
                    compute_type=args.compute_type,
                    vad_filter=args.vad_filter,
                    beam_size=args.beam_size,
                    best_of=args.best_of,
                    no_speech_threshold=args.no_speech_threshold,
                    chunk_seconds=args.chunk_seconds,
                    chunk_overlap=args.chunk_overlap,
                    clip_pad=args.clip_pad,
                    max_chars=args.max_chars,
                    max_lines=args.max_lines,
                    min_dur=args.min_dur,
                    max_dur=args.max_dur,
                    strip_fillers=args.strip_fillers,
                    sr=args.sr,
                    mono=args.mono,
                    logger=logger,
                )
            else:
                if not input_path:
                    raise PipelineError("--full_run requires --input when --sources_json is empty")
                result = run_full(
                    input_path,
                    wav_out=wav_out,
                    raw_out=raw_out,
                    subtitles_out=subtitles_out,
                    language=args.lang,
                    model_name=args.model,
                    model_dir=args.model_dir,
                    device=args.device,
                    compute_type=args.compute_type,
                    vad_filter=args.vad_filter,
                    beam_size=args.beam_size,
                    best_of=args.best_of,
                    no_speech_threshold=args.no_speech_threshold,
                    chunk_seconds=args.chunk_seconds,
                    chunk_overlap=args.chunk_overlap,
                    max_chars=args.max_chars,
                    max_lines=args.max_lines,
                    min_dur=args.min_dur,
                    max_dur=args.max_dur,
                    strip_fillers=args.strip_fillers,
                    sr=args.sr,
                    mono=args.mono,
                    logger=logger,
                )
            print(result)
            return 0

        if sources:
            result = run_full_sources(
                sources,
                wav_out=wav_out,
                raw_out=raw_out,
                subtitles_out=subtitles_out,
                language=args.lang,
                model_name=args.model,
                model_dir=args.model_dir,
                device=args.device,
                compute_type=args.compute_type,
                vad_filter=args.vad_filter,
                beam_size=args.beam_size,
                best_of=args.best_of,
                no_speech_threshold=args.no_speech_threshold,
                chunk_seconds=args.chunk_seconds,
                chunk_overlap=args.chunk_overlap,
                clip_pad=args.clip_pad,
                max_chars=args.max_chars,
                max_lines=args.max_lines,
                min_dur=args.min_dur,
                max_dur=args.max_dur,
                strip_fillers=args.strip_fillers,
                sr=args.sr,
                mono=args.mono,
                logger=logger,
            )
            print(result)
            return 0

        if not input_path:
            raise PipelineError("--input is required for single-source mode")

        wav_path = _resolve_input_to_wav(input_path, wav_out, sr=args.sr, mono=args.mono, logger=logger)
        recognition_language = _recognition_language(args.lang)
        display_language = _display_language(args.lang)
        raw = transcribe_wav(
            wav_path,
            language=recognition_language,
            model_name=args.model,
            model_dir=args.model_dir,
            device=args.device,
            compute_type=args.compute_type,
            vad_filter=args.vad_filter,
            beam_size=args.beam_size,
            best_of=args.best_of,
            no_speech_threshold=args.no_speech_threshold,
            chunk_seconds=args.chunk_seconds,
            chunk_overlap=args.chunk_overlap,
            logger=logger,
        )
        if _is_hinglish_mode(args.lang):
            raw["language"] = display_language
            raw.setdefault("meta", {})
            raw["meta"]["recognition_language"] = recognition_language
            raw["meta"]["language_mode"] = display_language
        write_json(raw, raw_out)

        if args.transcribe_only:
            print(f"transcribe: {raw_out}")
            return 0

        subs = postprocess_subtitles(
            raw,
            max_chars_per_line=args.max_chars,
            max_lines=args.max_lines,
            min_dur=args.min_dur,
            max_dur=args.max_dur,
            strip_fillers=args.strip_fillers,
            romanize_hinglish=None,
        )
        write_json(subs, subtitles_out)
        print({"raw_json": str(raw_out), "subtitles_json": str(subtitles_out), "items": len(subs.get("items", []))})
        return 0

    except PipelineError as exc:
        logger.error(str(exc))
        print(f"ERROR: {exc}")
        return 2
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled failure")
        print(f"ERROR: unexpected failure: {exc}")
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
