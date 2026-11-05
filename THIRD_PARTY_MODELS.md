# Third-party ML models (Docuvate Community Edition)

This file summarizes every machine-learning model the Community Edition stack can load at runtime. The canonical machine-readable list is [`third-party-models.manifest.json`](./third-party-models.manifest.json). CI fails if production code references a load key that is not listed there.

License attributions are collected in [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

## Default CPU worker image

| Model | Load key(s) | Source | Revision | License | Approx. size | Purpose |
| --- | --- | --- | --- | --- | ---: | --- |
| multilingual-e5-small | `intfloat/multilingual-e5-small` | [Hugging Face](https://huggingface.co/intfloat/multilingual-e5-small) | `614241f622f53c4eeff9890bdc4f31cfecc418b3` (ONNX int8 CPU) | MIT | ~118 MiB | Document/query embeddings |
| PaddleOCR PP-OCRv4 mobile | `paddleocr:PP-OCRv4-mobile-latin` | [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | PP-OCRv4 | Apache-2.0 | ~16 MiB | OCR for scans |

**Not shipped in the default CPU image:** weights trained on FUNSD, XFUND, or DocVQA for product inference paths.

## Optional worker extras

| Model | Load key | When loaded | License | Notes |
| --- | --- | --- | --- | --- |
| Donut DocVQA | `naver-clova-ix/donut-base-finetuned-docvqa` | GPU worker with `[donut]` extra | MIT | **DocVQA-trained; optional GPU only** |
| Docling layout | `docling:layout-default` | `EXTRACTOR_ENGINE=docling` + `[docling]` extra | MIT | Package-resolved layout weights |
| Tesseract | `tesseract:deu+eng` | `EXTRACTOR_ENGINE=tesseract` + `[tesseract]` extra | Apache-2.0 | Host/language-pack dependent |

## Verification

```bash
python -m docuvate_worker.infrastructure.ml.third_party_models
```

Or from the repository root: `bash scripts/ci/check-third-party-models.sh`.
