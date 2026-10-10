from docuvate_worker.infrastructure.extractors.field_value_normalize import (
    strip_leading_sender_label_prefixes,
)


def test_strip_repeated_sender_prefixes() -> None:
    raw = "Absender: Kurzer Absender: Demo Nord GmbH"
    assert strip_leading_sender_label_prefixes(raw) == "Demo Nord GmbH"
