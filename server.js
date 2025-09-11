import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import db from './schema.js'
import multer from 'multer'

const app = express()
const PORT = 4000
app.use(express.json())
app.use(cors())
const __file = fileURLToPath(import.meta.url)
const __dir = path.dirname(__file)
app.use(express.static(path.join(__dir, 'frontend')))

const storage = multer.memoryStorage()
const upload = multer({ storage })

app.get('/', (req, res) => {
    res.sendFile(path.join(__dir, 'frontend', 'index.html'))
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

app.get('/list', (req, res) => {
    try {
        const songData = db.prepare('SELECT * FROM audio').all()
        const name = songData.song_name
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

app.post('/upload', upload.single("audio"), (req, res) => {
    if (!req.file) return res.sendStatus(401);

    try {
        const stmt = db.prepare('INSERT INTO audio (song, song_name) VALUES (?, ?)')
        stmt.run(req.file.buffer, req.file.originalname)
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