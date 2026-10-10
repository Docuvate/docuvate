# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import io

from docuvate_worker.domain.models import ExtractionBlock, ExtractionResult
from docuvate_worker.domain.ports import ExtractorEngine
from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_field_suggestions


class TesseractExtractor(ExtractorEngine):
    """Optional last-resort OCR — set EXTRACTOR_ENGINE=tesseract and install [tesseract] extra."""

    name = "tesseract"

    def supports(self, mime_type: str) -> bool:
        return mime_type.startswith("image/") or mime_type == "application/pdf"

    def extract(self, content: bytes, mime_type: str) -> ExtractionResult:
        text, blocks = self._ocr_with_layout(content, mime_type)
        return ExtractionResult(
            text=text.strip(),
            fields=[],
            field_suggestions=heuristic_field_suggestions(text),
            blocks=blocks or None,
        )

    def _ocr_with_layout(self, content: bytes, mime_type: str) -> tuple[str, list[ExtractionBlock]]:
        import pytesseract  # noqa: PLC0415
        from pdf2image import convert_from_bytes  # noqa: PLC0415
        from PIL import Image  # noqa: PLC0415

        if mime_type == "application/pdf":
            images = convert_from_bytes(content)
            if not images:
                return "", []
            page_texts: list[str] = []
            all_blocks: list[ExtractionBlock] = []
            block_index = 0
            for page_num, image in enumerate(images, start=1):
                page_text, blocks = self._ocr_image(
                    image, page=page_num, pytesseract=pytesseract, block_offset=block_index
                )
                if page_text:
                    page_texts.append(page_text)
                all_blocks.extend(blocks)
                block_index += len(blocks)
            return "\n\n".join(page_texts), all_blocks

        image = Image.open(io.BytesIO(content))
        text, blocks = self._ocr_image(image, page=1, pytesseract=pytesseract, block_offset=0)
        return text, blocks

    def _ocr_image(
        self,
        image: object,
        page: int,
        *,
        pytesseract: object,
        block_offset: int,
    ) -> tuple[str, list[ExtractionBlock]]:
        width, height = image.size  # type: ignore[attr-defined]
        text = pytesseract.image_to_string(image, lang="deu+eng")  # type: ignore[attr-defined]
        output_cls = getattr(pytesseract, "Output", None)
        output_type = getattr(output_cls, "DICT", None) if output_cls is not None else None
        data = pytesseract.image_to_data(  # type: ignore[attr-defined]
            image, lang="deu+eng", output_type=output_type
        )
        blocks: list[ExtractionBlock] = []
        n = len(data.get("text", []))
        for i in range(n):
            word = (data["text"][i] or "").strip()
            if not word:
                continue
            conf = int(data["conf"][i])
            if conf < 0:
                continue
            left = float(data["left"][i])
            top = float(data["top"][i])
            w = float(data["width"][i])
            h = float(data["height"][i])
            if width <= 0 or height <= 0:
                continue
            blocks.append(
                ExtractionBlock(
                    page=page,
                    x=left / width,
                    y=top / height,
                    width=w / width,
                    height=h / height,
                    text=word,
                    block_index=block_offset + i,
                )
            )
        return text, blocks
