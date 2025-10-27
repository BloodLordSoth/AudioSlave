import express from "express";
import dotenv from "dotenv";
import cors from "cors";
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
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  createUser,
  fetchUser,
  insertAudio,
  fetchSongs,
  getSong,
  deleteSong,
} from "./db.js";
import crypto from "crypto";
import path from "path";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("./frontend"));
const storage = multer.memoryStorage();
const upload = multer({ storage });

const bucket = process.env.BUCKET;
const region = process.env.BUCKET_REGION;
const accessKey = process.env.BUCKET_ACCESS_KEY;
const secretKey = process.env.BUCKET_SECRET_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  region: region,
});

app.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) throw new UnauthorizedError();

    const hash = await hashPass(password);
    await createUser(username, hash);
    res.status(200).send("Registration success!");
  } catch (e) {
    next(e);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) throw new UnauthorizedError();

    const userRecord = await fetchUser(username);

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

app.get("/list", authenticate, async (req, res, next) => {
  try {
    if (!req.user.id) throw new ForbiddenError();

    const songData = await fetchSongs(req.user.id);

    if (!songData) throw new NotFoundError();

    res.status(200).json({ info: songData });
  } catch (e) {
    next(e);
  }
});

app.get("/music/:id", async (req, res, next) => {
  try {
    const songID = req.params.id;

    if (!songID) throw new UnauthorizedError();

    const songData = await getSong(songID);

    if (!songData) throw new NotFoundError();

    const params = {
      Bucket: bucket,
      Key: songData.key,
    };

    const command = new GetObjectCommand(params);
    const signedURL = await getSignedUrl(s3, command, { exipiresIn: 3600 });

    //res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send({ url: signedURL });
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

app.delete("/music/:id", async (req, res, next) => {
  try {
    const songID = req.params.id;

    if (!songID) throw new UnauthorizedError();

    const songInfo = await getSong(songID);

    const params = {
      Bucket: bucket,
      Key: songInfo.key,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    await deleteSong(songID);

    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
});

app.post(
  "/upload",
  upload.single("audio"),
  authenticate,
  async (req, res, next) => {
    try {
      const username = req.user.name;
      const file = req.file;
      if (!req.file || !req.user.name) throw new UnauthorizedError();

      const fname = crypto.randomBytes(16).toString("hex");
      const ext = path.extname(file.originalname);
      const key = `${username}/${fname}${ext}`;

      const params = {
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const url = `https://${bucket}.s3.${region}.amazonaws/${username}/${fname}${ext}`;

      const command = new PutObjectCommand(params);
      await s3.send(command);

      await insertAudio(
        req.user.id,
        key,
        url,
        file.mimetype,
        file.originalname,
      );

      res.status(200).send("Song has been uploaded!");
    } catch (e) {
      next(e);
    }
  },
);

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
