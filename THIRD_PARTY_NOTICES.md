# Third-party notices (ML models and runtimes)

Docuvate Community Edition (SUL-1.0) bundles or downloads the third-party components below. Full license texts for SPDX-identified licenses are available from the [SPDX License List](https://spdx.org/licenses/).

## Models

### intfloat/multilingual-e5-small (MIT)

Copyright (c) Microsoft Corporation. Used for document and query embeddings. See the [model card](https://huggingface.co/intfloat/multilingual-e5-small).

### BAAI/bge-reranker-v2-m3 and int8 variant (Apache-2.0)

Copyright Beijing Academy of Artificial Intelligence (BAAI) and contributors. Used for multilingual RAG reranking. See [bge-reranker-v2-m3](https://huggingface.co/BAAI/bge-reranker-v2-m3).

### PaddleOCR PP-OCRv4 (Apache-2.0)

Copyright PaddlePaddle authors and contributors. Detection and recognition weights downloaded by PaddleOCR at runtime. See [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR).

### RapidOCR / PP-OCRv5 English-Latin recognition (Apache-2.0)

Copyright PaddlePaddle and RapidAI contributors. Shipped in the DocAI v0.3 bundle (`en_PP-OCRv5_rec_mobile.onnx`) for optional `DOCUVATE_OCR_BACKEND=rapidocr`. See [RapidOCR](https://github.com/RapidAI/RapidOCR).

### DocAI v0.3 CPU bundle — CORD field/link heads (CC-BY-4.0)

Field head (logistic regression), F2 stacking head, and link ranker ONNX graphs trained on [CORD-v2](https://github.com/clovaai/cord) train split only. Attribution: Clova AI Research.

### German NER layout transformer (GermEval 2014 + synthetic docs, CC-BY-4.0)

`ner_doc.int8.onnx` uses GermEval 2014 (Shared Task on Named Entity Recognition) under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) plus Docuvate synthetic layout documents for DATE/MONEY types.

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
