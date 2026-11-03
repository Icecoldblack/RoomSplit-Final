const path = require("path");
const { DatabaseSync } = require("node:sqlite");

// One SQLite file holds all the data; it is created on first run
const db = new DatabaseSync(process.env.DB_FILE || path.join(__dirname, "roomsplit.db"));
db.exec("PRAGMA foreign_keys = ON");

// Every owner-owned table carries user_id so each owner only sees their own data
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    size_sqft    INTEGER,
    monthly_rent REAL NOT NULL DEFAULT 0,
    notes        TEXT
  );

  CREATE TABLE IF NOT EXISTS tenants (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id     INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    lease_start TEXT,
    lease_end   TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount    REAL NOT NULL,
    paid_on   TEXT NOT NULL,
    for_month TEXT NOT NULL,
    note      TEXT
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    category       TEXT NOT NULL,
    monthly_amount REAL NOT NULL
  );
`);

module.exports = db;
