# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
# Guard image: digest-pinned Postgres client + AWS CLI for MinIO probe (avoids pulling public.ecr.aws/aws-cli in CI).
FROM postgres:18.6-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873

RUN apk add --no-cache aws-cli \
  || (apk add --no-cache python3 py3-pip && pip install --break-system-packages --no-cache-dir awscli)

COPY scripts/db/db-storage-guard.sh /guard.sh
RUN chmod +x /guard.sh

ENTRYPOINT ["/bin/sh", "/guard.sh"]
