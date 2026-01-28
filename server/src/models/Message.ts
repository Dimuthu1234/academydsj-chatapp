import { query } from '../config/database.js'

export interface Message {
  id: string
  sender_id: string
  receiver_id?: string
  group_id?: string
  content: string
  file_url?: string
  file_name?: string
  message_type: 'text' | 'image' | 'file' | 'video' | 'audio'
  read_at?: Date
  created_at: Date
}

export interface MessagePublic {
  id: string
  senderId: string
  receiverId?: string
  groupId?: string
  content: string
  fileUrl?: string
  fileName?: string
  messageType: string
  readAt?: string
  createdAt: string
}

export function toPublicMessage(message: Message): MessagePublic {
  return {
    id: message.id,
    senderId: message.sender_id,
    receiverId: message.receiver_id,
    groupId: message.group_id,
    content: message.content,
    fileUrl: message.file_url,
    fileName: message.file_name,
    messageType: message.message_type,
    readAt: message.read_at?.toISOString(),
    createdAt: message.created_at.toISOString(),
  }
}

export async function createMessage(
  senderId: string,
  data: {
    receiverId?: string
    groupId?: string
    content: string
    fileUrl?: string
    fileName?: string
    messageType?: Message['message_type']
  }
): Promise<Message> {
  const result = await query(
    `INSERT INTO messages (sender_id, receiver_id, group_id, content, file_url, file_name, message_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      senderId,
      data.receiverId || null,
      data.groupId || null,
      data.content,
      data.fileUrl || null,
      data.fileName || null,
      data.messageType || 'text',
    ]
  )

  return result.rows[0]
}

export async function getMessages(
  userId: string,
  chatId: string,
  isGroup: boolean,
  limit = 50,
  offset = 0
): Promise<Message[]> {
  let result

  if (isGroup) {
    result = await query(
      `SELECT * FROM messages
       WHERE group_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [chatId, limit, offset]
    )
  } else {
    result = await query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, chatId, limit, offset]
    )
  }

  return result.rows.reverse()
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  await query(
    `UPDATE messages SET read_at = NOW() WHERE id = $1`,
    [messageId]
  )
}

export async function markMessagesAsRead(userId: string, senderId: string): Promise<void> {
  await query(
    `UPDATE messages
     SET read_at = NOW()
     WHERE receiver_id = $1 AND sender_id = $2 AND read_at IS NULL`,
    [userId, senderId]
  )
}

export async function getLastMessage(
  userId: string,
  chatId: string,
  isGroup: boolean
): Promise<Message | null> {
  let result

  if (isGroup) {
    result = await query(
      `SELECT * FROM messages
       WHERE group_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [chatId]
    )
  } else {
    result = await query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, chatId]
    )
  }

  return result.rows[0] || null
}

export async function getUnreadCount(userId: string, senderId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) as count FROM messages
     WHERE receiver_id = $1 AND sender_id = $2 AND read_at IS NULL`,
    [userId, senderId]
  )
  return parseInt(result.rows[0].count, 10)
}
