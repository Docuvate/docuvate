"""Typst source from vendored pre-fix renderer (main before pixel-diff fixes)."""

from __future__ import annotations

import functools
import importlib.util
import sys
import types
from collections.abc import Callable
from pathlib import Path

from docuvate_worker.domain.layout_ir import LayoutIrDocument

_FIXTURE_ROOT = Path(__file__).resolve().parents[1] / "fixtures" / "pre_fix_renderer"
_PACKAGE = "pre_fix_renderer"


@functools.cache
def _load_pre_fix_renderer() -> Callable[[LayoutIrDocument], str]:
    pkg = types.ModuleType(_PACKAGE)
    pkg.__path__ = [str(_FIXTURE_ROOT)]
    pkg.__package__ = _PACKAGE
    sys.modules[_PACKAGE] = pkg

    order = ("font_map", "text_fit", "render_run", "render_typst")
    for name in order:
        full_name = f"{_PACKAGE}.{name}"
        path = _FIXTURE_ROOT / f"{name}.py"
        spec = importlib.util.spec_from_file_location(
            full_name,
            path,
            submodule_search_locations=[str(_FIXTURE_ROOT)],
        )
        if spec is None or spec.loader is None:
            raise RuntimeError(f"pre_fix snapshot missing: {name}")
        mod = importlib.util.module_from_spec(spec)
        mod.__package__ = _PACKAGE
        sys.modules[full_name] = mod
        spec.loader.exec_module(mod)

    render_typst = sys.modules[f"{_PACKAGE}.render_typst"]
    renderer: Callable[[LayoutIrDocument], str] = render_typst.layout_ir_to_typst
    return renderer


def typst_from_pre_fix_renderer(doc: LayoutIrDocument) -> str:
    return _load_pre_fix_renderer()(doc)
