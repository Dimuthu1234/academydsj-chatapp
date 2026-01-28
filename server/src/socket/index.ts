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
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'file://'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
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
