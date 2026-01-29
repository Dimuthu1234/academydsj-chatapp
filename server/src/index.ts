import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import { initDatabase } from './config/database.js'
import { setupSocketIO } from './socket/index.js'

import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import messagesRoutes from './routes/messages.js'
import groupsRoutes from './routes/groups.js'
import filesRoutes from './routes/files.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const httpServer = createServer(app)

// CORS configuration - supports multiple origins for web, desktop, and mobile apps
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:5173']
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, desktop apps, curl, etc.)
    if (!origin) return callback(null, true)
    // Allow configured origins
    if (corsOrigins.some(allowed => origin === allowed || origin.startsWith('file://') || origin.startsWith('capacitor://'))) {
      return callback(null, true)
    }
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const uploadsPath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')
app.use('/uploads', express.static(uploadsPath))

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/chats', messagesRoutes)
app.use('/api/groups', groupsRoutes)
app.use('/api/files', filesRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

setupSocketIO(httpServer)

const PORT = process.env.PORT || 3001

async function start() {
  try {
    await initDatabase()

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
