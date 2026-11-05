# Model-gates baseline adjustments

## Chat metrics removed (`chat_extractive.*`, `chat_routing.*`)

Document chat (RAG, cited answers, intent routing) was removed from the CE MVP. The
`chat_extractive` and `chat_routing` gates, their fixtures, and their baseline entries were
deleted together with the feature; no remaining gate was weakened.
