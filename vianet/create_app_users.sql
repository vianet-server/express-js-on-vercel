-- create_app_users.sql
-- Table: app_users

CREATE TABLE IF NOT EXISTS app_users (
  userid       SERIAL PRIMARY KEY,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  accessGroup  VARCHAR(100)[] DEFAULT '{}',
  userType     VARCHAR(50)  DEFAULT 'user',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_userType ON app_users(userType);
