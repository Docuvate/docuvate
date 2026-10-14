# Changelog

All notable changes to this project are documented here.

## [Unreleased]

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
