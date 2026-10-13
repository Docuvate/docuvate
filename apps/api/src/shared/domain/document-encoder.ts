// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Logical Hugging Face model id for the central document encoder. */
export const DOCUMENT_ENCODER_ID = 'intfloat/multilingual-e5-small';

/** Pinned weights revision on Hugging Face (MIT). */
export const DOCUMENT_ENCODER_HF_REVISION = '614241f622f53c4eeff9890bdc4f31cfecc418b3';

/** Stored on each document row; includes the ONNX int8 runtime generation. */
export const DOCUMENT_ENCODER_REVISION = `${DOCUMENT_ENCODER_HF_REVISION}-onnx-int8`;
