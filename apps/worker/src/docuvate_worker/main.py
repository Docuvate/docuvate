# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import os

from fastapi import FastAPI
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from docuvate_worker.infrastructure.hardware_capabilities import detect_hardware_capabilities
from docuvate_worker.infrastructure.onnx_runtime_env import configure_onnx_runtime_env
from docuvate_worker.infrastructure.otel import init_otel
from docuvate_worker.presentation.routes import router

configure_onnx_runtime_env()
init_otel("docuvate-worker")
detect_hardware_capabilities()

app = FastAPI(title="Docuvate Worker", version="0.1.0")
app.include_router(router)

if os.environ.get("OTEL_SDK_DISABLED", "").lower() != "true":
    FastAPIInstrumentor.instrument_app(app)
