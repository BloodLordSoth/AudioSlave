import Database from 'better-sqlite3'

const db = new Database('audioData.db')

db.exec(`
    CREATE TABLE IF NOT EXISTS audio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song BLOB,
    song_name TEXT NOT NULL
    )
`)

export default db

