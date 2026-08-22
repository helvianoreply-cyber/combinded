import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import http from 'http'
import Razorpay from 'razorpay'
import { WebSocketServer } from 'ws'

const port = Number(process.env.PORT) || 5175
const keyId = process.env.RAZORPAY_KEY_ID
const keySecret = process.env.RAZORPAY_KEY_SECRET

const razorpay =
  keyId && keySecret
    ? new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })
    : null

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/create-order', async (req, res) => {
  try {
    if (!razorpay || !keyId) {
      res.status(500).json({ message: 'Razorpay is not configured' })
      return
    }

    const durationRaw = typeof req.body?.duration === 'string' ? req.body.duration : ''
    const duration = durationRaw === '24h' || durationRaw === 'month' ? durationRaw : ''

    if (!duration) {
      res.status(400).json({ message: 'Invalid duration' })
      return
    }

    const amount = duration === '24h' ? 169 * 100 : 999 * 100
    const currency = 'INR'
    let receipt = String(req.body?.receipt ?? `rcpt_${Date.now()}`)

    if (receipt.length > 40) {
      receipt = receipt.slice(0, 40)
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: {
        project: 'helvia-remote',
      },
    })

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    })
  } catch (error) {
    console.error('Failed to create Razorpay order', error)
    const message =
      (error && error.error && error.error.description) ||
      (error && error.message) ||
      'Failed to create order'
    res.status(500).json({ message })
  }
})

const server = http.createServer(app)

const rooms = new Map()

const wss = new WebSocketServer({ server, path: '/ws' })
wss.on('connection', (socket) => {
  socket.__meta = { room: null, role: null }

  socket.on('message', (data) => {
    let message
    try {
      message = JSON.parse(String(data))
    } catch (error) {
      return
    }

    if (message?.type === 'join') {
      const room = String(message?.room ?? '').trim()
      const role = message?.role === 'host' ? 'host' : message?.role === 'controller' ? 'controller' : null
      if (!room || !role) {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid join request' }))
        return
      }

      socket.__meta = { room, role }

      const existing = rooms.get(room) ?? { host: null, controller: null }
      if (existing[role] && existing[role] !== socket) {
        existing[role].close()
      }
      existing[role] = socket
      rooms.set(room, existing)

      socket.send(JSON.stringify({ type: 'joined', room, role }))

      const peer = role === 'host' ? existing.controller : existing.host
      if (peer) {
        peer.send(JSON.stringify({ type: 'peer', status: 'connected' }))
        socket.send(JSON.stringify({ type: 'peer', status: 'connected' }))
      }
      return
    }

    if (message?.type === 'signal') {
      const room = String(message?.room ?? '').trim()
      const payload = message?.payload ?? null
      if (!room || !payload) {
        return
      }

      const record = rooms.get(room)
      if (!record) {
        return
      }

      const meta = socket.__meta ?? { role: null }
      const target = meta.role === 'host' ? record.controller : record.host
      if (!target) {
        return
      }

      target.send(
        JSON.stringify({
          type: 'signal',
          room,
          payload,
        })
      )
    }
  })

  socket.on('close', () => {
    const meta = socket.__meta
    const room = meta?.room
    const role = meta?.role
    if (!room || !role) {
      return
    }
    const record = rooms.get(room)
    if (!record) {
      return
    }
    if (record[role] === socket) {
      record[role] = null
    }
    const other = role === 'host' ? record.controller : record.host
    if (other) {
      other.send(JSON.stringify({ type: 'peer', status: 'disconnected' }))
    }
    if (!record.host && !record.controller) {
      rooms.delete(room)
    } else {
      rooms.set(room, record)
    }
  })
})

server.listen(port, () => {
  console.log(`API + signaling server running on ${port}`)
})
