# Changelog

All notable changes to this project are documented here.

## [Unreleased]

## [0.1.1] — 2026-11-21

UX-audit pass for Upload → OCR → Strukturieren → Prüfen → Suche (#134).

### Fixed

- Review-queue open-fields hint i18n interpolation (`{{count}}`) and locale placeholder guard.
- Library and global search share field-value matching (digit-prefix amounts, e.g. `1234` ↔ `1.234,56`).
- Ctrl/Cmd+K opens global search (capture-phase shortcut) instead of the label filter.
- Upload supports `.txt` preview; corrupt PDFs fail early with retry.
- Heuristic date suggestions reject invoice IDs like `NW-2026-0042`.
- Field correction routes into the Strukturieren workbench as the primary path.
- Open field/label counts use one source of truth; Fertig copy when nothing is open.
- Viewer polish: sticky table mark, zoom, DnD dropzone, locale seed (local only), upload queue done-before-assignment.

## [0.1.0-beta] — 2026-10-14

Community Edition beta focused on CPU-friendly ML productization and operator documentation.

### Added

- **Per-tenant ML feature flags** with installation-wide `DOCUVATE_FEATURE_*` defaults and admin overrides: `exactAnswers`, `answerAbstention`, `smartDuplicates`, `learnedValueTypes` (default **on** when env unset), `layoutKeyValueRoles` (default **off**, experimental), and `localChatModel`.
- **Structured fact index and chat router** when `exactAnswers` is enabled; optional **`answerAbstention`** match gate to refuse low-confidence fact answers instead of falling through to retrieval.
- **Smart duplicate hints** (`smartDuplicates`): template-subtracted scoring alongside content-hash matching (hints only, no auto-delete).
- **Learned value types** for field extraction (`learnedValueTypes`).
- **Optional layout key/value role head** (`layoutKeyValueRoles`, experimental).
- **Central document encoder:** `intfloat/multilingual-e5-small` as **ONNX int8 on CPU**, with **automatic per-tenant background re-index** after an embedding revision change (`GET /v1/settings/encoder-reindex`).
- **Optional Docker Compose `chat-local` profile:** Ollama with **`qwen2.5:1.5b`**; default stack runs **without Ollama** (~6 GiB host RAM guidance).
- **User documentation:** [ML feature flags](./docs/ml-feature-flags.md) (English) and [ML-Feature-Flags (DE)](./docs/ml-feature-flags.de.md); updated [Self-hosting](./docs/self-hosting.md) and README quickstart RAM profiles.
- **Third-party model manifest** and license notices for shipped ML artifacts (`THIRD_PARTY_MODELS.md`, `THIRD_PARTY_NOTICES.md`).

### Changed

- **Licensing:** Docuvate Community Edition is **source-available** under the
  [Sustainable Use License 1.0](./LICENSE) (fair-code model). Enterprise and Cloud are
  separate commercial products that build on CE (not shipped in this repository). Official
  SDKs (`@docuvate/sdk`, `docuvate` on Flutter) are **MIT**.
