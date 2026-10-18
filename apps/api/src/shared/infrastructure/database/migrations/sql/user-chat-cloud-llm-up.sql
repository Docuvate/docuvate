ALTER TABLE user_preferences
  ADD COLUMN document_chat_cloud_base_url text,
  ADD COLUMN document_chat_cloud_api_key_encrypted bytea;
