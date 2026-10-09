"""Typst source from vendored pre-fix renderer (main before pixel-diff fixes)."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

from docuvate_worker.domain.layout_ir import LayoutIrDocument

_FIXTURE_ROOT = Path(__file__).resolve().parents[1] / "fixtures" / "pre_fix_renderer"
_LOADED = False


def _ensure_pre_fix_modules() -> None:
    global _LOADED
    if _LOADED:
        return
    order = ("font_map", "text_fit", "render_run", "render_typst")
    for name in order:
        module_name = f"docuvate_worker.infrastructure.layout.{name}"
        path = _FIXTURE_ROOT / f"{name}.py"
        spec = importlib.util.spec_from_file_location(module_name, path)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"pre_fix snapshot missing: {name}")
        mod = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = mod
        spec.loader.exec_module(mod)
    _LOADED = True


def typst_from_pre_fix_renderer(doc: LayoutIrDocument) -> str:
    prefix = "docuvate_worker.infrastructure.layout."
    saved = {k: sys.modules[k] for k in list(sys.modules) if k.startswith(prefix)}
    try:
        _ensure_pre_fix_modules()
        mod = sys.modules[f"{prefix}render_typst"]
        return mod.layout_ir_to_typst(doc)
    finally:
        for key, module in saved.items():
            sys.modules[key] = module
