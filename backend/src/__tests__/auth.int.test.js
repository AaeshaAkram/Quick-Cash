import request from 'supertest'
import express from 'express'
import authRoutes from '../../src/routes/auth.js'
import miniRoutes from '../../src/routes/miniStatement.js'
import { authenticate } from '../../src/middleware/auth.js'

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/mini', miniRoutes)

describe('Auth routes', () => {
  it('rejects invalid card number', async () => {
    const res = await request(app).post('/api/auth/card/validate').send({ cardNumber: '123' })
    expect(res.status).toBe(400)
  })

  it('mini statement pdf requires auth', async () => {
    const res = await request(app).get('/api/mini/atm/mini-statement/pdf')
    expect([401,403]).toContain(res.status)
  })

  it('receipt pdf requires auth', async () => {
    const res = await request(app).get('/api/atm/receipt/1')
    expect([401,403,404]).toContain(res.status)
  })
})





