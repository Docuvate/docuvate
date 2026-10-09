ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" boolean DEFAULT false NOT NULL;

CREATE TABLE "twoFactor" (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  secret text NOT NULL,
  "backupCodes" text NOT NULL,
  verified boolean DEFAULT true NOT NULL,
  "failedVerificationCount" integer DEFAULT 0 NOT NULL,
  "lockedUntil" timestamptz,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "twoFactor_userId_idx" ON "twoFactor"("userId");

CREATE TABLE passkey (
  id text PRIMARY KEY,
  name text,
  "publicKey" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "credentialID" text NOT NULL,
  counter integer NOT NULL,
  "deviceType" text NOT NULL,
  "backedUp" boolean NOT NULL,
  transports text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  aaguid text
);

CREATE INDEX passkey_userId_idx ON passkey("userId");
CREATE UNIQUE INDEX passkey_credentialID_unique_idx ON passkey("credentialID");
