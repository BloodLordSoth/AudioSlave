import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __file = fileURLToPath(import.meta.url)
const __dir = path.dirname(__file)
const dbPath = path.join(__dir, 'audioData.db')

const db = new Database(dbPath)

db.pragma('foreign_keys = ON')

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song BLOB,
    song_name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`)

export default db

