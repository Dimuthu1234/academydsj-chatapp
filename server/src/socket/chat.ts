import { Server, Socket } from 'socket.io'
import { createMessage, toPublicMessage } from '../models/Message.js'
import { isGroupMember } from '../models/Group.js'

interface AuthenticatedSocket extends Socket {
  userId?: string
}

export function setupChatHandlers(
  io: Server,
  socket: AuthenticatedSocket,
  userId: string
) {
  socket.on('chat:join', async (chatId: string) => {
    const isGroup = chatId.length === 36 && chatId.includes('-')

    if (isGroup) {
      const isMember = await isGroupMember(chatId, userId)
      if (!isMember) {
        socket.emit('error', { message: 'Not a member of this group' })
        return
      }
    }

    socket.join(`chat:${chatId}`)
    console.log(`User ${userId} joined chat ${chatId}`)
  })

  socket.on('chat:leave', (chatId: string) => {
    socket.leave(`chat:${chatId}`)
    console.log(`User ${userId} left chat ${chatId}`)
  })

  socket.on('chat:message', async (data: {
    chatId: string
    message: {
      content: string
      messageType?: string
      fileUrl?: string
      fileName?: string
    }
  }) => {
    try {
      const { chatId, message: messageData } = data

      const isGroup = chatId.length === 36 && chatId.includes('-')
      let isValidRecipient = true

      if (isGroup) {
        isValidRecipient = await isGroupMember(chatId, userId)
      }

      if (!isValidRecipient) {
        socket.emit('error', { message: 'Cannot send message to this chat' })
        return
      }

      const message = await createMessage(userId, {
        receiverId: isGroup ? undefined : chatId,
        groupId: isGroup ? chatId : undefined,
        content: messageData.content,
        messageType: (messageData.messageType as 'text' | 'image' | 'file' | 'video' | 'audio') || 'text',
        fileUrl: messageData.fileUrl,
        fileName: messageData.fileName,
      })

      const publicMessage = toPublicMessage(message)

      io.to(`chat:${chatId}`).emit('chat:message', publicMessage)

      if (!isGroup) {
        io.to(`user:${chatId}`).emit('chat:message', publicMessage)
      }

      console.log(`Message sent in chat ${chatId} by ${userId}`)
    } catch (error) {
      console.error('Failed to send message:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  socket.on('chat:typing', (data: { chatId: string; isTyping: boolean }) => {
    const { chatId, isTyping } = data

    socket.to(`chat:${chatId}`).emit('chat:typing', {
      chatId,
      userId,
      isTyping,
    })

    socket.to(`user:${chatId}`).emit('chat:typing', {
      chatId: userId,
      userId,
      isTyping,
    })
  })

  socket.on('chat:read', async (data: { chatId: string; messageId: string }) => {
    const { chatId, messageId } = data

    const { markMessageAsRead } = await import('../models/Message.js')
    await markMessageAsRead(messageId)

    io.to(`chat:${chatId}`).emit('chat:read', {
      chatId,
      messageId,
      readAt: new Date().toISOString(),
    })

    io.to(`user:${chatId}`).emit('chat:read', {
      chatId: userId,
      messageId,
      readAt: new Date().toISOString(),
    })
  })
}
