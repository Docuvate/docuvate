from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_fields


def test_vendor_strips_absender_label_prefix() -> None:
    text = "Rechnung Layout-Workspace Demo\nKurzer Absender: Demo Nord GmbH\nBruttobetrag: 12.500,00 EUR"
    fields = {f.key: f.value for f in heuristic_fields(text)}
    assert fields.get("vendor") == "Demo Nord GmbH"


def test_vendor_skips_landscape_heading_line() -> None:
    text = "QUERFORMAT-FIXTURE 842x595\nLandscape-only content row A"
    fields = {f.key: f.value for f in heuristic_fields(text)}
    assert "vendor" not in fields


def test_vendor_skips_academic_paper_title_without_sender_evidence() -> None:
    text = "\n".join(
        [
            "Closed-Form Document Layout Classification",
            "with Certified Coarse-to-Fine Abstention",
            "Jonas Demo",
        ]
    )
    fields = {f.key: f.value for f in heuristic_fields(text)}
    assert "vendor" not in fields


def test_vendor_uses_company_after_banner_not_banner_itself() -> None:
    text = (
        "Synthetic layout regression document with enough words to classify as born digital.\n"
        "Acme GmbH"
    )
    fields = {f.key: f.value for f in heuristic_fields(text)}
    assert fields.get("vendor") == "Acme GmbH"
