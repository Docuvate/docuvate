# Baseline metric schema change (PR #46 round 2)

This PR replaces trivial 1.0 chat/classification floors with realistic metrics:

- Chat: separate abstention precision/recall, multi-doc and open-question accuracy.
- Classification: `coarse_coverage_rate` and `novel_abstain_rate` replace `coarse_coverage_count`.

Parent `baseline.json` on `main` did not contain these keys; floors are established from measured harness output minus CI margin.
