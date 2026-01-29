import { Router, Response } from 'express'
import {
  createMessage,
  getMessages,
  markMessagesAsRead,
  getLastMessage,
  getUnreadCount,
  toPublicMessage,
} from '../models/Message.js'
import { findUserById, toPublicUser } from '../models/User.js'
import { getUserGroups, getGroupById, toPublicGroup, isGroupMember } from '../models/Group.js'
import { AuthRequest, authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const directChats = await getDirectChats(req.userId)
    const groupChats = await getGroupChats(req.userId)

    const chats = [...directChats, ...groupChats].sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || ('createdAt' in a ? a.createdAt : '') || ''
      const bTime = b.lastMessage?.createdAt || ('createdAt' in b ? b.createdAt : '') || ''
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    res.json({ chats })
  } catch (error) {
    console.error('Get chats error:', error)
    res.status(500).json({ error: 'Failed to get chats' })
  }
})

async function getDirectChats(userId: string) {
  const { query } = await import('../config/database.js')

  const result = await query(
    `SELECT DISTINCT
       CASE
         WHEN sender_id = $1 THEN receiver_id
         ELSE sender_id
       END as participant_id
     FROM messages
     WHERE (sender_id = $1 OR receiver_id = $1)
       AND group_id IS NULL`,
    [userId]
  )

  const chats = []

  for (const row of result.rows) {
    const participant = await findUserById(row.participant_id)
    if (!participant) continue

    const lastMessage = await getLastMessage(userId, row.participant_id, false)
    const unreadCount = await getUnreadCount(userId, row.participant_id)

    chats.push({
      id: row.participant_id,
      type: 'direct',
      participant: toPublicUser(participant),
      lastMessage: lastMessage ? toPublicMessage(lastMessage) : undefined,
      unreadCount,
    })
  }

  return chats
}

async function getGroupChats(userId: string) {
  const groups = await getUserGroups(userId)
  const chats = []

  for (const group of groups) {
    const lastMessage = await getLastMessage(userId, group.id, true)

    chats.push({
      id: group.id,
      type: 'group',
      group: toPublicGroup(group),
      lastMessage: lastMessage ? toPublicMessage(lastMessage) : undefined,
      unreadCount: 0,
      createdAt: group.created_at.toISOString(),
    })
  }

  return chats
}

router.get('/:chatId/messages', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { chatId } = req.params
    const { limit = '50', offset = '0' } = req.query

    const group = await getGroupById(chatId)
    const isGroup = !!group

    if (isGroup) {
      const isMember = await isGroupMember(chatId, req.userId)
      if (!isMember) {
        res.status(403).json({ error: 'Not a member of this group' })
        return
      }
    }

    const messages = await getMessages(
      req.userId,
      chatId,
      isGroup,
      parseInt(limit as string, 10),
      parseInt(offset as string, 10)
    )

    if (!isGroup) {
      await markMessagesAsRead(req.userId, chatId)
    }

    res.json({ messages: messages.map(toPublicMessage) })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

router.post('/:chatId/messages', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { chatId } = req.params
    const { content, messageType, fileUrl, fileName } = req.body

    if (!content && !fileUrl) {
      res.status(400).json({ error: 'Content or file is required' })
      return
    }

    const group = await getGroupById(chatId)
    const isGroup = !!group

    if (isGroup) {
      const isMember = await isGroupMember(chatId, req.userId)
      if (!isMember) {
        res.status(403).json({ error: 'Not a member of this group' })
        return
      }
    }

    const message = await createMessage(req.userId, {
      receiverId: isGroup ? undefined : chatId,
      groupId: isGroup ? chatId : undefined,
      content: content || '',
      messageType,
      fileUrl,
      fileName,
    })

    res.status(201).json({ message: toPublicMessage(message) })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

export default router
