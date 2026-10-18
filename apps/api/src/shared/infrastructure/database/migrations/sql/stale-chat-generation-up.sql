-- Fail assistant messages left pending/streaming after cited-chat fixes (ADR 024).
UPDATE chat_messages
SET generation_status = 'failed',
    generation_phase = NULL,
    error_code = 'generation_timeout',
    error_detail = 'Stale generation reconciled at migrate',
    updated_at = now()
WHERE role = 'assistant'
  AND generation_status IN ('pending', 'streaming');
