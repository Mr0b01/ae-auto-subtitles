import json
import math
from pathlib import Path
from typing import Any


def ensure_parent(path: str | Path) -> Path:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def read_json(path: str | Path) -> Any:
    p = Path(path)
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)


def _to_json_safe(value: Any) -> Any:
    if isinstance(value, float):
        if math.isfinite(value):
            return value
        return None

    if isinstance(value, dict):
        out: dict[Any, Any] = {}
        for k, v in value.items():
            out[k] = _to_json_safe(v)
        return out

    if isinstance(value, list):
        return [_to_json_safe(v) for v in value]

    if isinstance(value, tuple):
        return [_to_json_safe(v) for v in value]

    return value


def write_json(data: Any, path: str | Path, *, indent: int = 2) -> Path:
    p = ensure_parent(path)
    safe_data = _to_json_safe(data)
    with p.open("w", encoding="utf-8") as f:
        json.dump(safe_data, f, ensure_ascii=False, indent=indent, allow_nan=False)
        f.write("\n")
    return p
