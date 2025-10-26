import request from 'supertest'
import app from '../app.js'

describe('/GET dashboard', () => {
    test('Should return 200 statusCode', async () => {
        const res = await request(app).get('/register')
        expect(res.statusCode).toBe(200)
    })
})

describe('/POST register endpoint', () => {
    describe('Without username', () => {
        test('Should return 401 statusCode', async () => {
            const res = await request(app).post('/register').send({
                password: "heythere"
            })
            expect(res.statusCode).toBe(401)
        })
    })
})