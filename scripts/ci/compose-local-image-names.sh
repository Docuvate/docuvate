#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
# Local compose/kind builds: tag app images with short names (not ghcr.io/...:edge).
export DOCUVATE_API_IMAGE="${DOCUVATE_API_IMAGE:-docuvate-api}"
export DOCUVATE_WEB_IMAGE="${DOCUVATE_WEB_IMAGE:-docuvate-web}"
export DOCUVATE_WORKER_IMAGE="${DOCUVATE_WORKER_IMAGE:-docuvate-worker}"
