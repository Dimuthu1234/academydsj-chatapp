import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import { socketAuthMiddleware } from '../middleware/auth.js'
import { updateUserStatus, User } from '../models/User.js'
import { setupChatHandlers } from './chat.js'
import { setupCallHandlers } from './call.js'

interface AuthenticatedSocket extends Socket {
  user?: User
  userId?: string
}

const connectedUsers = new Map<string, string>()

export function setupSocketIO(httpServer: HTTPServer) {
  // Socket.IO CORS - supports web, desktop (Electron), and mobile (Capacitor) apps
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:5173']

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, desktop apps)
        if (!origin) return callback(null, true)
        // Allow configured origins
        if (corsOrigins.some(allowed => origin === allowed)) {
          return callback(null, true)
        }
        // Allow file:// and capacitor:// for desktop/mobile apps
        if (origin.startsWith('file://') || origin.startsWith('capacitor://')) {
          return callback(null, true)
        }
        // Allow localhost for development
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true)
        }
        callback(new Error('Not allowed by CORS'))
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication required'))
      }

      const user = await socketAuthMiddleware(token)

      if (!user) {
        return next(new Error('Invalid token'))
      }

      socket.user = user
      socket.userId = user.id
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!
    const user = socket.user!

    console.log(`User connected: ${user.display_name} (${userId})`)

    connectedUsers.set(userId, socket.id)
    await updateUserStatus(userId, 'online')

    socket.broadcast.emit('user:online', userId)

    socket.join(`user:${userId}`)

    setupChatHandlers(io, socket, userId)
    setupCallHandlers(io, socket, userId)

    socket.on('user:status', async (status: User['status']) => {
      await updateUserStatus(userId, status)
      socket.broadcast.emit('user:status', { userId, status })
    })

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.display_name} (${userId})`)

      connectedUsers.delete(userId)
      await updateUserStatus(userId, 'offline')

      socket.broadcast.emit('user:offline', userId)
    })
  })

  return io
}

export function getConnectedUsers() {
  return connectedUsers
}
