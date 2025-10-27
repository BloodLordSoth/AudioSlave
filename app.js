import express from "express";
import dotenv from "dotenv";
import cors from "cors";
//import path from "path";
//import { fileURLToPath } from "url";
import db from "./schema.js";
import multer from "multer";
import { hashPass, checkHash } from "./auth.js";
import jwt from "jsonwebtoken";
import {
  AppError,
  NotFoundError,
  ConstraintError,
  ForbiddenError,
  UnauthorizedError,
  InvalidCredentialError,
} from "./errors.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
//const __file = fileURLToPath(import.meta.url);
//const __dir = path.dirname(__file);
app.use(express.static("./frontend"));
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) throw new UnauthorizedError();

    const hash = await hashPass(password);
    const stmt = db.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)",
    );
    stmt.run(username, hash);
    res.status(200).send("Registration success!");
  } catch (e) {
    next(e);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) throw new UnauthorizedError();

    const userRecord = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);

    if (!userRecord) throw new NotFoundError();

    const hash = await checkHash(password, userRecord.password);

    if (!hash) throw new InvalidCredentialError();

    const user = { id: userRecord.id, name: username };

    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
      expiresIn: "55m",
    });

    res.status(200).json({ name: username, accessToken: accessToken });
  } catch (e) {
    next(e);
  }
});

app.post("/song", (req, res, next) => {
  try {
    const userid = req.body.userid;

    if (!userid) throw new UnauthorizedError();

    const info = db.prepare("SELECT * FROM audio WHERE id = ?").get(userid);

    if (!info) throw new NotFoundError();

    const audio = info.song;
    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(audio);
  } catch (e) {
    next(e);
  }
});

app.get("/download/:id", (req, res, next) => {
  const id = req.params.id;

  if (!id) throw new UnauthorizedError();

  try {
    const songData = db.prepare("SELECT * FROM audio WHERE id = ?").get(id);
    res.set(
      "Content-Disposition",
      `Attachment; filename=${songData.song_name}`,
    );
    res.set("Content-Type", "audio/mpeg");
    res.status(200).send(songData.song);
  } catch (e) {
    next(e);
  }
});

app.get("/list", authenticate, (req, res, next) => {
  try {
    const userRecord = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.user.id);

    if (!userRecord) throw new UnauthorizedError();

    const songData = db
      .prepare("SELECT * FROM audio WHERE user_id = ?")
      .all(userRecord.id);
    res.status(200).json({ info: songData });
  } catch (e) {
    next(e);
  }
});

app.get("/music/:id", (req, res, next) => {
  try {
    const songID = req.params.id;

    if (!songID) throw new UnauthorizedError();

    const songData = db.prepare("SELECT * FROM audio WHERE id = ?").get(songID);

    if (!songData) throw new NotFoundError();

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(songData.song);
  } catch (e) {
    next(e);
  }
});

app.get("/tokencheck", authenticate, (req, res, next) => {
  try {
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
});

app.delete("/music/:id", (req, res, next) => {
  try {
    const songID = req.params.id;

    if (!songID) throw new UnauthorizedError();

    db.prepare("DELETE FROM audio WHERE id = ?").run(songID);
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
});

app.post("/upload", upload.single("audio"), authenticate, (req, res, next) => {
  try {
    if (!req.file) throw new UnauthorizedError();

    const userRecord = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.user.id);

    if (!userRecord) throw new NotFoundError();

    const stmt = db.prepare(
      "INSERT INTO audio (song, song_name, user_id) VALUES (?, ?, ?)",
    );
    stmt.run(req.file.buffer, req.file.originalname, userRecord.id);
    res.status(200).send("Song has been uploaded!");
  } catch (e) {
    next(e);
  }
});

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) throw new UnauthorizedError();

  const token = authHeader.split(" ")[1];

  if (!token) throw new ForbiddenError();

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    if (err) throw new ForbiddenError();
    req.user = user;
    next();
  });
}

app.use((err, req, res, next) => {
  if (err.message.includes("UNIQUE constraint failed")) {
    throw new ConstraintError();
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).send({ error: err.message });
  }

  console.log(err);
  res.status(500).send({ error: "There was an error reaching the server" });
});

export default app;
