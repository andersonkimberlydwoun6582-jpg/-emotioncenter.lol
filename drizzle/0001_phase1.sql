PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS anonymous_identities (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  is_banned INTEGER NOT NULL DEFAULT 0 CHECK (is_banned IN (0, 1)),
  banned_reason TEXT
);

CREATE TABLE IF NOT EXISTS recovery_credentials (
  credential_id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL REFERENCES anonymous_identities(id) ON DELETE CASCADE,
  auth_token_hash TEXT NOT NULL UNIQUE,
  pepper_version INTEGER NOT NULL DEFAULT 1,
  derivation_version INTEGER NOT NULL DEFAULT 1 CHECK (derivation_version = 1),
  wrap_iv TEXT NOT NULL,
  wrapped_identity_key TEXT NOT NULL,
  crypto_version INTEGER NOT NULL DEFAULT 1 CHECK (crypto_version = 1),
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  rotated_from TEXT REFERENCES recovery_credentials(credential_id) ON DELETE SET NULL,
  is_revoked INTEGER NOT NULL DEFAULT 0 CHECK (is_revoked IN (0, 1)),
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_recovery_credentials_identity
ON recovery_credentials(identity_id, is_revoked, expires_at);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL REFERENCES anonymous_identities(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL REFERENCES recovery_credentials(credential_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token
ON sessions(token_hash, revoked_at, expires_at);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL REFERENCES anonymous_identities(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  write_token TEXT,
  encrypted_size INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drafts_identity_updated
ON drafts(identity_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS cloud_backups (
  draft_id TEXT PRIMARY KEY REFERENCES drafts(id) ON DELETE CASCADE,
  ciphertext TEXT NOT NULL,
  content_iv TEXT NOT NULL,
  wrapped_draft_key TEXT NOT NULL,
  draft_key_iv TEXT NOT NULL,
  crypto_version INTEGER NOT NULL DEFAULT 1 CHECK (crypto_version = 1),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  identity_id TEXT REFERENCES anonymous_identities(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  object_type TEXT,
  object_id TEXT,
  ip_hmac TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_events_identity
ON security_events(identity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS idempotency_records (
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_identity_id TEXT,
  response_resource_id TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (scope, idempotency_key)
);

PRAGMA optimize;
