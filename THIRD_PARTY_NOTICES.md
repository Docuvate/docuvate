# Third-party notices (ML models and runtimes)

Docuvate Community Edition (SUL-1.0) bundles or downloads the third-party components below. Full license texts for SPDX-identified licenses are available from the [SPDX License List](https://spdx.org/licenses/).

## Models

### intfloat/multilingual-e5-small (MIT)

Copyright (c) Microsoft Corporation. Used for document and query embeddings. See the [model card](https://huggingface.co/intfloat/multilingual-e5-small).

### BAAI/bge-reranker-v2-m3 and int8 variant (Apache-2.0)

Copyright Beijing Academy of Artificial Intelligence (BAAI) and contributors. Used for multilingual RAG reranking. See [bge-reranker-v2-m3](https://huggingface.co/BAAI/bge-reranker-v2-m3).

### PaddleOCR PP-OCRv4 (Apache-2.0)

Copyright PaddlePaddle authors and contributors. Detection and recognition weights downloaded by PaddleOCR at runtime. See [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR).

### Qwen2.5 Instruct (Apache-2.0) via Ollama

Copyright Alibaba Cloud. GGUF artifacts are pulled through [Ollama](https://ollama.com/) (MIT) when local chat is enabled.

### deepset/xlm-roberta-base-squad2-distilled (MIT)

Copyright deepset GmbH and contributors. Optional extractive reader; see [model card](https://huggingface.co/deepset/xlm-roberta-base-squad2-distilled).

### naver-clova-ix/donut-base-finetuned-docvqa (MIT, optional GPU extra)

Copyright NAVER Corp. Optional visual DocVQA path only; not included in the default CPU worker image.

### Docling (MIT, optional extra)

Copyright IBM / Docling contributors. Layout models are resolved by the `docling` Python package when that extractor engine is enabled.

### Tesseract OCR (Apache-2.0, optional extra)

Copyright Google and contributors. Language data is provided by the host or container image, not by Docuvate.

## Runtimes used to execute models

| Component | License | Role |
| --- | --- | --- |
| ONNX Runtime (via fastembed) | MIT | ONNX embedding and reranker inference |
| sentence-transformers / PyTorch CPU | Apache-2.0 | Embedding fallback backend |
| PaddlePaddle | Apache-2.0 | PaddleOCR inference |
| llama.cpp (via Ollama) | MIT | Local LLM inference |

## Training-data policy

Community Edition release images do not ship inference weights trained on FUNSD, XFUND, DocVQA, or DocILE for default product paths. The optional Donut DocVQA checkpoint is documented separately and requires the GPU `[donut]` worker extra.
