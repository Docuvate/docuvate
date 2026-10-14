# German chat eval (`eval/chat_de`)

Synthetic routing eval for the cited-chat pipeline (no customer document text in the repo).

- **Test split:** `test.json` (frozen for CI via `chat_routing` model gate).
- **Answer-type held-out eval:** `answer_type_eval.json` (CI via `chat_answer_type` model gate; never used for prototype training).
- **Regenerate:** `python bench/model_gates/fixtures/generate_chat_de_eval.py`
- **Intent prototypes:** `python bench/model_gates/fixtures/generate_chat_intent_prototypes.py` (requires worker embeddings).
- **Answer-type prototypes:** `python bench/model_gates/fixtures/generate_chat_answer_type_prototypes.py` (reads `bench/model_gates/fixtures/chat_answer_type_training.json`).

Extractive QA over document bodies is gated separately in `bench/model_gates/fixtures/chat_extractive_cases.json`.
