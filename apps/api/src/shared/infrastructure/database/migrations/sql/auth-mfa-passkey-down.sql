DROP INDEX IF EXISTS passkey_credentialID_unique_idx;
DROP TABLE IF EXISTS passkey;
DROP TABLE IF EXISTS "twoFactor";
ALTER TABLE "user" DROP COLUMN IF EXISTS "twoFactorEnabled";
