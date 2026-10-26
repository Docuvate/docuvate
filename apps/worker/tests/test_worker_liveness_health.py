# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import inspect

from docuvate_worker.presentation import routes


def test_liveness_health_is_async_so_probes_skip_thread_pool() -> None:
    assert inspect.iscoroutinefunction(routes.health)
