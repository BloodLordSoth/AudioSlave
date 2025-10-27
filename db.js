import db from "./schema.js";

export async function fetchUser(username) {
  const userData = await db.execute("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  return userData.rows[0];
}

export async function createUser(username, hash) {
  await db.execute("INSERT INTO users (username, password) VALUES (?, ?)", [
    username,
    hash,
  ]);
}

export async function insertAudio(id, key, url, mimetype, name) {
  await db.execute(
    "INSERT INTO audio (user_id, key, song_url, mime_type, song_name) VALUES (?, ?, ?, ?, ?)",
    [id, key, url, mimetype, name],
  );
}

export async function fetchSongs(id) {
  const songData = await db.execute("SELECT * FROM audio WHERE user_id = ?", [
    id,
  ]);
  return songData.rows;
}

export async function getSong(songid) {
  const songData = await db.execute("SELECT * FROM audio WHERE id = ?", [
    songid,
  ]);
  return songData.rows[0];
}

export async function deleteSong(songid) {
  await db.execute("DELETE FROM audio WHERE id = ?", [songid]);
}
