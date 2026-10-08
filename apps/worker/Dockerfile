FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    libgomp1 \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY apps/worker ./apps/worker
ARG WORKER_OPTIONAL_EXTRAS=
ENV FLAGS_use_mkldnn=0
ENV PYTHONPATH=/app/apps/worker/src
ENV HOME=/opt/models
ENV FASTEMBED_CACHE_PATH=/opt/models/fastembed
ENV PADDLE_PDX_CACHE_HOME=/opt/models/paddle
RUN mkdir -p /opt/models/fastembed /opt/models/paddle /opt/models/.paddleocr
RUN pip install --no-cache-dir uv \
 && if [ -n "$WORKER_OPTIONAL_EXTRAS" ]; then \
      uv pip install --system -e "./apps/worker[${WORKER_OPTIONAL_EXTRAS}]"; \
    else \
      uv pip install --system -e ./apps/worker; \
    fi \
 && (uv pip uninstall --system opencv-python opencv-contrib-python 2>/dev/null || true) \
 && uv pip install --system --reinstall "opencv-python-headless>=4.8.0,<5.0.0" "numpy>=1.26,<2" \
 && python -c "import cv2; from paddleocr import PaddleOCR; print('opencv', cv2.__version__)" \
 && python -c "from docuvate_worker.infrastructure.extractors.paddle_engine import prewarm_paddle_models; prewarm_paddle_models()" \
 && python -c "from docuvate_worker.infrastructure.fastembed_model import get_embedding_model; get_embedding_model()" \
 && chown -R 65534:65534 /opt/models
ENV EXTRACTOR_ENGINE=pipeline
ENV PADDLE_OCR_LANG=german
WORKDIR /app/apps/worker
EXPOSE 8000
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["uvicorn", "docuvate_worker.main:app", "--host", "0.0.0.0", "--port", "8000"]
