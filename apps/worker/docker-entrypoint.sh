#!/bin/sh
set -e
if [ -d /var/lib/docuvate-ml ]; then
  mkdir -p /var/lib/docuvate-ml/paddleocr /var/lib/docuvate-ml/cache
  if [ ! -e /root/.paddleocr ]; then
    ln -sf /var/lib/docuvate-ml/paddleocr /root/.paddleocr
  fi
  if [ ! -e /root/.cache ]; then
    ln -sf /var/lib/docuvate-ml/cache /root/.cache
  fi
fi
if [ "${PADDLE_PREWARM_ON_START:-0}" = "1" ]; then
  PYTHONPATH=/app/apps/worker/src python -c \
    "from docuvate_worker.infrastructure.extractors.paddle_engine import prewarm_paddle_models; prewarm_paddle_models()" \
    || echo "Paddle prewarm skipped (non-fatal)."
fi
exec "$@"
