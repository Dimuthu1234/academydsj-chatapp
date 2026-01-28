import { query } from '../config/database.js'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  password_hash?: string
  display_name: string
  avatar_url?: string
  status: 'online' | 'offline' | 'away' | 'busy'
  created_at: Date
  updated_at: Date
}

export interface UserPublic {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  status: string
  createdAt: string
}

export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    status: user.status,
    createdAt: user.created_at.toISOString(),
  }
}

export async function createUser(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 12)

  const result = await query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, passwordHash, displayName]
  )

  return result.rows[0]
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  )
  return result.rows[0] || null
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await query(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, 'display_name' | 'avatar_url' | 'status'>>
): Promise<User> {
  const fields: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (data.display_name !== undefined) {
    fields.push(`display_name = $${paramIndex++}`)
    values.push(data.display_name)
  }
  if (data.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`)
    values.push(data.avatar_url)
  }
  if (data.status !== undefined) {
    fields.push(`status = $${paramIndex++}`)
    values.push(data.status)
  }

  fields.push(`updated_at = NOW()`)
  values.push(id)

  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  )

  return result.rows[0]
}

export async function updateUserStatus(id: string, status: User['status']): Promise<void> {
  await query(
    `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, id]
  )
}

export async function searchUsers(searchQuery: string, excludeUserId?: string): Promise<User[]> {
  let sql = `
    SELECT * FROM users
    WHERE (display_name ILIKE $1 OR email ILIKE $1)
  `
  const params: unknown[] = [`%${searchQuery}%`]

  if (excludeUserId) {
    sql += ` AND id != $2`
    params.push(excludeUserId)
  }

  sql += ` LIMIT 20`

  const result = await query(sql, params)
  return result.rows
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  if (!user.password_hash) return false
  return bcrypt.compare(password, user.password_hash)
}
