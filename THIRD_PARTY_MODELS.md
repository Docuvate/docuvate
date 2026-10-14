# Third-party ML models (Docuvate Community Edition)

This file summarizes every machine-learning model the Community Edition stack can load at runtime. The canonical machine-readable list is [`third-party-models.manifest.json`](./third-party-models.manifest.json). CI fails if production code references a load key that is not listed there.

License attributions are collected in [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

## Default CPU worker image

| Model | Load key(s) | Source | Revision | License | Approx. size | Purpose |
| --- | --- | --- | --- | --- | ---: | --- |
| multilingual-e5-small | `intfloat/multilingual-e5-small`, `Qdrant/multilingual-e5-small-onnx` | [Hugging Face](https://huggingface.co/intfloat/multilingual-e5-small) | `614241f622f53c4eeff9890bdc4f31cfecc418b3` | MIT | ~128 MiB | Document/query embeddings |
| bge-reranker-v2-m3-int8 | `BAAI/bge-reranker-v2-m3-int8` (default) | [Hugging Face](https://huggingface.co/BAAI/bge-reranker-v2-m3) | package default | Apache-2.0 | ~220 MiB | RAG reranking for cited chat |
| PaddleOCR PP-OCRv4 mobile | `paddleocr:PP-OCRv4-mobile-latin` | [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | PP-OCRv4 | Apache-2.0 | ~16 MiB | OCR for scans |

Permissive reranker alternates allowlisted in code (same manifest entry): `BAAI/bge-reranker-v2-m3`, `BAAI/bge-reranker-base`, `Xenova/ms-marco-MiniLM-L-6-v2`, `Xenova/ms-marco-MiniLM-L-12-v2`.

**Not shipped in the default CPU image:** weights trained on FUNSD, XFUND, or DocVQA for product inference paths.

## Compose / Ollama (local LLM)

| Model | Load key | Source | License | Approx. size | Purpose |
| --- | --- | --- | --- | ---: | --- |
| Qwen2.5 3B Instruct | `qwen2.5:3b` | [Ollama library](https://ollama.com/library/qwen2.5) | Apache-2.0 | ~1.9 GiB | Default RAG chat LLM |
| Qwen2.5 1.5B Instruct | `qwen2.5:1.5b` | [Ollama library](https://ollama.com/library/qwen2.5) | Apache-2.0 | ~960 MiB | Lower-RAM LLM default in some API paths |

Models are pulled by the Ollama sidecar at deploy time (`OLLAMA_MODEL`), not embedded in the worker image.

## Optional worker extras

| Model | Load key | When loaded | License | Notes |
| --- | --- | --- | --- | --- |
| XLM-R extractive reader | `deepset/xlm-roberta-base-squad2-distilled` | Lazy when extractive QA runs | MIT | SQuAD 2.0 distilled reader |
| Donut DocVQA | `naver-clova-ix/donut-base-finetuned-docvqa` | GPU worker with `[donut]` extra | MIT | **DocVQA-trained; optional GPU only** |
| Docling layout | `docling:layout-default` | `EXTRACTOR_ENGINE=docling` + `[docling]` extra | MIT | Package-resolved layout weights |
| Tesseract | `tesseract:deu+eng` | `EXTRACTOR_ENGINE=tesseract` + `[tesseract]` extra | Apache-2.0 | Host/language-pack dependent |

## Verification

```bash
python -m docuvate_worker.infrastructure.ml.third_party_models
```

Or from the repository root: `bash scripts/ci/check-third-party-models.sh`.
