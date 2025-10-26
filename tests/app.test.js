import request from 'supertest'
import app from '../app.js'

describe('/GET dashboard', () => {
    test('Should return 200 statusCode', async () => {
        const res = await request(app).get('/register')
        expect(res.statusCode).toBe(200)
    })
})