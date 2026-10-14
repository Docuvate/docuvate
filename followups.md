# CE 0.1.0 beta integration follow-ups (nits)

Non-blocking notes from the single review round on PRs #60–#70.

## PR #61 — third-party model manifest

- Consider deduplicating the manifest CI step when #63 lands (both touch `third-party-models.manifest.json`; rebase #63 onto `main` after #61 and prefer the ONNX int8 manifest row from #63).

## PR #60 — ML feature flags

- Admin OpenAPI for tenant flag overrides could document idempotency of repeated PUTs in a follow-up (behavior is fine today).

## PR #63 — ONNX e5 encoder

- After #61+#60 merge, rebase and resolve manifest/OpenAPI/SDK drift once (encoder reindex routes + admin flag types).

## PR #62 — smart duplicates

- Removed `bench/model_gates/gates/duplicates.py` synthetic F1 gate (owner policy: no metric-based model gates in PR CI / harness promotion for this feature). Unit tests in `apps/worker/tests/test_smart_duplicates.py` remain the guard.
- Worker docstring mentions “benchmark F1 ≈ 0.86”; optional follow-up to cite eval location or drop the number.

## PR #64 — learned value types

- Nightly harness adds `bench/model_gates/gates/value_types.py` (regex parity smoke, not wired into PR CI today). Leave as stub promotion candidate only if policy allows nightly metric gates.

## PR #65 / #68 / #69 — exact facts stack

- #69 remains stacked on #68 until #68 merges; then retarget #69 to `main` and mark ready.
- `bench/exact_fact_match_calibrate.ts` is offline calibration tooling only (not PR CI).

## PR #66 — local chat profile

- Document in ops runbooks that `chat-local` profile is opt-in and distinct from dev compose overlay.

## PR #67 — layout KV roles

- Verified `layoutKeyValueRoles` installation default stays **off** (`false` in env defaults and remote-config fallbacks).

## PR #70 — beta docs

- Align EN/DE docs with flag defaults after #64 merge (`learnedValueTypes` default-on only once that PR is on `main`).
