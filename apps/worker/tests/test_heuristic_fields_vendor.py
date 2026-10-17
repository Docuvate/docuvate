from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_fields


def test_vendor_abstains_on_label_only_line_without_ml_gate() -> None:
    text = (
        "Rechnung Layout-Workspace Demo\n"
        "Kurzer Absender: Demo Nord GmbH\n"
        "Bruttobetrag: 12.500,00 EUR"
    )
    fields = {f.key: f.value for f in heuristic_fields(text)}
    assert fields.get("amount") == "12500.00"
    assert fields.get("vendor") == "Demo Nord GmbH"


def test_vendor_skips_landscape_heading_line() -> None:
    text = "QUERFORMAT-FIXTURE 842x595\nLandscape-only content row A"
    fields = {f.key: f.value for f in heuristic_fields(text)}
    assert "vendor" not in fields


def test_vendor_skips_synthetic_paper_title_without_sender_evidence() -> None:
    text = "\n".join(
        [
            "Synthetic Nine Word Academic Title Case Example Heading",
            "Second Line Author Names Only",
        ]
    )
    fields = {f.key: f.value for f in heuristic_fields(text)}
    assert "vendor" not in fields


def test_vendor_abstains_on_company_after_long_banner_without_ranker_support() -> None:
    text = (
        "Synthetic layout regression document with enough words to classify as born digital.\n"
        "Acme GmbH"
    )
    fields = {f.key: f.value for f in heuristic_fields(text)}
    assert "vendor" not in fields
