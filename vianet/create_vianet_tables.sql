-- create_vianet_tables.sql
-- Database: vianet
-- Run with: psql -U postgres -h localhost -p 5432 -d vianet -f create_vianet_tables.sql

-- users table (formerly app_users)
CREATE TABLE IF NOT EXISTS users (
  userid       SERIAL PRIMARY KEY,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  accessGroupId INTEGER    REFERENCES accessGroup(id) ON DELETE SET NULL,
  userType     VARCHAR(50) DEFAULT 'user',
  created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_usertype    ON users(userType);
CREATE INDEX IF NOT EXISTS idx_users_accessgroup ON users(accessGroupId);

-- inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id          SERIAL PRIMARY KEY,
  pname       TEXT,
  name        TEXT NOT NULL,
  brand       TEXT,
  quantity    INTEGER      DEFAULT 0,
  vQuantity   INTEGER      DEFAULT 0,
  price       NUMERIC(15,2) DEFAULT 0.00,
  model       TEXT,
  variant     TEXT,
  color       TEXT,
  category    TEXT[]        DEFAULT '{}',
  resource    JSONB         DEFAULT '{}',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_name   ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_brand  ON inventory(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_pname  ON inventory(pname);

-- inventoryAssessMap: accessGroup -> inventory mapping
CREATE TABLE IF NOT EXISTS inventoryAssessMap (
  id            SERIAL PRIMARY KEY,
  accessGroupId INTEGER    NOT NULL REFERENCES accessGroup(id) ON DELETE CASCADE,
  inventoryId   INTEGER    NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity      INTEGER      DEFAULT 0,
  price         NUMERIC(15,2) DEFAULT 0.00,
  settings      JSONB         DEFAULT '{}',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(accessGroupId, inventoryId)
);

CREATE INDEX IF NOT EXISTS idx_invassess_accessgroup ON inventoryAssessMap(accessGroupId);
CREATE INDEX IF NOT EXISTS idx_invassess_inventory   ON inventoryAssessMap(inventoryId);
