# German chat eval (`eval/chat_de`)

Synthetic routing eval for the cited-chat pipeline (no customer document text in the repo).

- **Test split:** `test.json` (frozen for CI via `chat_routing` model gate).
- **Regenerate:** `python bench/model_gates/fixtures/generate_chat_de_eval.py`
- **Intent prototypes:** `python bench/model_gates/fixtures/generate_chat_intent_prototypes.py` (requires worker embeddings).

Extractive QA over document bodies is gated separately in `bench/model_gates/fixtures/chat_extractive_cases.json`.
