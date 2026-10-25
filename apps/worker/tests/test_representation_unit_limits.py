# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import pytest

from docuvate_worker.domain.representation.unit_limits import cap_representation_units
from docuvate_worker.domain.representation.units import RepresentationUnit


def test_cap_representation_units_trims_to_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    import docuvate_worker.domain.representation.unit_limits as limits

    monkeypatch.setattr(limits, "representation_max_units", lambda: 4)
    units = [
        RepresentationUnit(
            unit_index=index,
            kind="paragraph",
            text="x" * (index + 1),
            page=1,
            x=0.0,
            y=0.0,
            width=1.0,
            height=0.1,
            char_start=None,
            char_end=None,
        )
        for index in range(10)
    ]
    capped = cap_representation_units(units)
    assert len(capped) == 4
    assert all(len(unit.text) >= 6 for unit in capped)
