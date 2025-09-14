import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import db from './schema.js'
import multer from 'multer'
import { hashPass, checkHash } from './auth.js'
import jwt from 'jsonwebtoken'

dotenv.config()
const app = express()
const PORT = 4000
app.use(express.json())
app.use(cors())
const __file = fileURLToPath(import.meta.url)
const __dir = path.dirname(__file)
app.use(express.static(path.join(__dir, 'frontend')))

const storage = multer.memoryStorage()
const upload = multer({ storage })

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dir, 'frontend', 'secure', 'dashboard.html'))
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) return res.sendStatus(401);

    try {
        const hash = await hashPass(password)
        const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)')
        stmt.run(username, hash)
        res.status(200).send('Registration success!')
    }
    catch (e) {
        console.error(e)
        res.sendStatus(500)
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) return res.sendStatus(401);

    try {
        const userRecord = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

        if (!userRecord) return res.sendStatus(403);

        const hash = await checkHash(password, userRecord.password)

        if (!hash) return res.sendStatus(403);

        const user = { id: userRecord.id, name: username }

        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '55m' })

        res.status(200).json({ accessToken: accessToken })

    }
    catch (e) {
        console.error(e)
        res.sendStatus(500)
    }
})

app.post('/song', (req, res) => {
    const userid = req.body.userid

    if (!userid) return res.sendStatus(401);

    try {
        const info = db.prepare('SELECT * FROM audio WHERE id = ?').get(userid)

        if (!info) return res.sendStatus(404);

        const audio = info.song
        res.setHeader('Content-Type', 'audio/mpeg')
        res.status(200).send(audio)
    }
    catch (e) {
        res.sendStatus(500)
        console.error(e)
    }
})

app.get('/list', authenticate, (req, res) => {
    try {
        const userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)

        if (!userRecord) return res.sendStatus(401);

        const songData = db.prepare('SELECT * FROM audio WHERE user_id = ?').all(userRecord.id)
        res.status(200).json({ info: songData })
    }
    catch (e) {
        console.error(e)
        res.sendStatus(500)
    }
})

app.get('/music/:id', (req, res) => {
    const songID = req.params.id

    if (!songID) return res.sendStatus(401);

    try {
        const songData = db.prepare('SELECT * FROM audio WHERE id = ?').get(songID)
        res.setHeader('Content-Type', 'audio/mpeg')
        res.status(200).send(songData.song)
    }
    catch (e) {
        res.sendStatus(500)
        console.error(e)
    }
})

app.delete('/music/:id', (req, res) => {
    const songID = req.params.id

    if (!songID) return res.sendStatus(401);

    try {
        const songData = db.prepare('DELETE FROM audio WHERE id = ?').run(songID)
        res.sendStatus(204)
    }
    catch (e) {
        console.error(e)
        res.sendStatus(500)
    }
})

app.post('/upload', upload.single("audio"), authenticate, (req, res) => {
    if (!req.file) return res.sendStatus(401);

    try {
        const userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)

        if (!userRecord) return res.sendStatus(401);

        const stmt = db.prepare('INSERT INTO audio (song, song_name, user_id) VALUES (?, ?, ?)')
        stmt.run(req.file.buffer, req.file.originalname, userRecord.id)
        res.status(200).send('Song has been uploaded!')
    }
    catch (e) {
        res.sendStatus(500)
        console.error(e)
    }
})

app.listen(PORT, () => {
    console.log(`listening on localhost:${PORT}`)
})

function authenticate(req, res, next){
    const authHeader = req.headers['authorization']

    if (!authHeader) return res.sendStatus(401);

    const token = authHeader.split(' ')[1]

    if (!token) return res.sendStatus(403);

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user
        next()
    })

}