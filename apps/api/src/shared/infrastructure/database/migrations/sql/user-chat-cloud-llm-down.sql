ALTER TABLE user_preferences
  DROP COLUMN IF EXISTS document_chat_cloud_api_key_encrypted,
  DROP COLUMN IF EXISTS document_chat_cloud_base_url;
