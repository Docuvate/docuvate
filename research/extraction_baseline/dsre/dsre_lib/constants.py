# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

SPLIT_TRAIN = 0
SPLIT_CAL = 1
SPLIT_CONFIRM = 2
SPLIT_TEST = 3

SPLIT_NAMES = ("train", "cal", "confirm", "test")

TARGET_PRECISION = 0.98
MIN_ACCEPTED_CAL = 20
MIN_ACCEPTED_CONFIRM = 20
RIDGE_ALPHA = 10.0

EMBED_DIM = 384

FIELD_TYPE_TEXT = 0
FIELD_TYPE_DATE = 1
FIELD_TYPE_AMOUNT = 2
FIELD_TYPE_ADDRESS = 3

SROIE_SCHEMA: tuple[tuple[str, str, int], ...] = (
    ("company", "merchant or company name on the receipt", FIELD_TYPE_TEXT),
    ("date", "transaction date on the receipt", FIELD_TYPE_DATE),
    ("address", "merchant street address on the receipt", FIELD_TYPE_ADDRESS),
    ("total", "final total amount paid", FIELD_TYPE_AMOUNT),
)

CORD_SCHEMA: tuple[tuple[str, str, int], ...] = (
    ("total_price", "total price amount on the receipt", FIELD_TYPE_AMOUNT),
    ("subtotal", "subtotal before tax", FIELD_TYPE_AMOUNT),
    ("tax", "tax amount", FIELD_TYPE_AMOUNT),
    ("cashprice", "cash paid amount", FIELD_TYPE_AMOUNT),
    ("changeprice", "change returned amount", FIELD_TYPE_AMOUNT),
    ("date", "transaction date", FIELD_TYPE_DATE),
    ("store_name", "store or merchant name", FIELD_TYPE_TEXT),
    ("phone", "telephone number", FIELD_TYPE_TEXT),
    ("address", "store address", FIELD_TYPE_ADDRESS),
    ("item_name", "line item product name", FIELD_TYPE_TEXT),
    ("item_price", "line item price", FIELD_TYPE_AMOUNT),
    ("item_count", "line item quantity", FIELD_TYPE_AMOUNT),
)
