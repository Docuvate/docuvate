"""Mirror of apps/api cited stream preview for bench TTFT (readable text only)."""

from __future__ import annotations


def extract_readable_cited_answer_preview(partial_json: str) -> str:
    texts: list[str] = []
    marker = '"text"'
    cursor = 0
    while cursor < len(partial_json):
        idx = partial_json.find(marker, cursor)
        if idx < 0:
            break
        i = idx + len(marker)
        while i < len(partial_json) and partial_json[i] in " :":
            i += 1
        if i >= len(partial_json) or partial_json[i] != '"':
            cursor = idx + 1
            continue
        i += 1
        start = i
        escaped = False
        closed = False
        while i < len(partial_json):
            ch = partial_json[i]
            if escaped:
                escaped = False
                i += 1
                continue
            if ch == "\\":
                escaped = True
                i += 1
                continue
            if ch == '"':
                closed = True
                break
            i += 1
        if not closed:
            break
        fragment = partial_json[start:i]
        texts.append(
            fragment.replace("\\n", "\n")
            .replace('\\"', '"')
            .replace("\\\\", "\\")
        )
        cursor = i + 1
    return " ".join(texts).strip()


def looks_like_cited_answer_json(content: str) -> bool:
    trimmed = content.lstrip()
    return trimmed.startswith("{") and '"claims"' in trimmed
