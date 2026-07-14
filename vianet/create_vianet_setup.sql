-- Setup database vianet and create tables
-- Run with: psql -U postgres -h localhost -p 5432 -d postgres -f create_vianet_setup.sql

-- Create database if not exists
SELECT 'CREATE DATABASE vianet'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'vianet')\gexec

-- In vianet database run:
--
-- \c vianet
--
-- CREATE TABLE IF NOT EXISTS accessGroup (
--   id           SERIAL PRIMARY KEY,
--   name         VARCHAR(255) NOT NULL UNIQUE,
--   accessKey    VARCHAR(255) NOT NULL,
--   privileges   JSONB        DEFAULT '{}',
--   memberCount  INTEGER      DEFAULT 0,
--   created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
--   updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
-- );
--
-- CREATE INDEX idx_accessgroup_name ON accessGroup(name);
-- CREATE INDEX idx_accessgroup_accesskey ON accessGroup(accessKey);
--
-- CREATE TABLE IF NOT EXISTS app_users (
--   userid        SERIAL PRIMARY KEY,
--   email         VARCHAR(255) NOT NULL UNIQUE,
--   password      VARCHAR(255) NOT NULL,
--   accessGroupId INTEGER      REFERENCES accessGroup(id) ON DELETE SET NULL,
--   userType      VARCHAR(50)  DEFAULT 'user',
--   created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
--   updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
-- );
--
-- CREATE INDEX idx_app_users_email      ON app_users(email);
-- CREATE INDEX idx_app_users_usertype    ON app_users(userType);
-- CREATE INDEX idx_app_users_accessgroup ON app_users(accessGroupId);
