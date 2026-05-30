-- ===================================================================
-- DATABASE SCHEMA (PostgreSQL)
-- This file is for reference. The application uses initDatabase() 
-- in src/database.ts to automatically create these tables.
-- ===================================================================

CREATE TABLE IF NOT EXISTS admins (
    id              SERIAL          PRIMARY KEY,
    username        VARCHAR(100)    NOT NULL UNIQUE,
    email           VARCHAR(100)    NOT NULL UNIQUE,
    password_hash   VARCHAR(500)    NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id              SERIAL          PRIMARY KEY,
    event_date      VARCHAR(10)     NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    description     TEXT            NOT NULL,
    category        VARCHAR(50)     NOT NULL,
    image_url       TEXT            NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery (
    id              SERIAL          PRIMARY KEY,
    image_url       VARCHAR(500)    NOT NULL,
    label           VARCHAR(255)    NOT NULL,
    "order"         INT             DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    phone           VARCHAR(20)     NULL,
    message         TEXT            NULL,
    type            VARCHAR(50)     DEFAULT 'inquiry',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
