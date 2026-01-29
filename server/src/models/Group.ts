import { query } from '../config/database.js'
import { User, toPublicUser } from './User.js'

export interface Group {
  id: string
  name: string
  description?: string
  avatar_url?: string
  admin_id: string
  created_at: Date
  updated_at: Date
}

export interface GroupMember {
  group_id: string
  user_id: string
  joined_at: Date
  user?: User
}

export interface GroupWithMembers extends Group {
  members: GroupMember[]
}

export interface GroupPublic {
  id: string
  name: string
  description?: string
  avatarUrl?: string
  adminId: string
  members: {
    userId: string
    user: ReturnType<typeof toPublicUser>
    joinedAt: string
  }[]
  createdAt: string
}

export function toPublicGroup(group: GroupWithMembers): GroupPublic {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    avatarUrl: group.avatar_url,
    adminId: group.admin_id,
    members: group.members.map((m) => ({
      userId: m.user_id,
      user: toPublicUser(m.user!),
      joinedAt: m.joined_at.toISOString(),
    })),
    createdAt: group.created_at.toISOString(),
  }
}

export async function createGroup(
  name: string,
  description: string | undefined,
  adminId: string,
  memberIds: string[]
): Promise<GroupWithMembers> {
  const result = await query(
    `INSERT INTO groups (name, description, admin_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, description || null, adminId]
  )

  const group = result.rows[0] as Group

  const allMemberIds = [...new Set([adminId, ...memberIds])]

  for (const memberId of allMemberIds) {
    await query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [group.id, memberId]
    )
  }

  return getGroupById(group.id) as Promise<GroupWithMembers>
}

export async function getGroupById(groupId: string): Promise<GroupWithMembers | null> {
  const groupResult = await query(
    `SELECT * FROM groups WHERE id = $1`,
    [groupId]
  )

  if (groupResult.rows.length === 0) return null

  const group = groupResult.rows[0] as Group

  const membersResult = await query(
    `SELECT gm.*, u.id as user_id, u.email, u.display_name, u.avatar_url, u.status, u.created_at as user_created_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1`,
    [groupId]
  )

  const members: GroupMember[] = membersResult.rows.map((row) => ({
    group_id: row.group_id,
    user_id: row.user_id,
    joined_at: row.joined_at,
    user: {
      id: row.user_id,
      email: row.email,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      status: row.status,
      created_at: row.user_created_at,
      updated_at: row.user_created_at,
    },
  }))

  return { ...group, members }
}

export async function getUserGroups(userId: string): Promise<GroupWithMembers[]> {
  const result = await query(
    `SELECT g.id FROM groups g
     JOIN group_members gm ON g.id = gm.group_id
     WHERE gm.user_id = $1
     ORDER BY g.created_at DESC`,
    [userId]
  )

  const groups: GroupWithMembers[] = []

  for (const row of result.rows) {
    const group = await getGroupById(row.id)
    if (group) groups.push(group)
  }

  return groups
}

export async function updateGroup(
  groupId: string,
  data: Partial<Pick<Group, 'name' | 'description' | 'avatar_url'>>
): Promise<Group> {
  const fields: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`)
    values.push(data.description)
  }
  if (data.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`)
    values.push(data.avatar_url)
  }

  fields.push(`updated_at = NOW()`)
  values.push(groupId)

  const result = await query(
    `UPDATE groups SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  )

  return result.rows[0]
}

export async function addGroupMember(groupId: string, userId: string): Promise<void> {
  await query(
    `INSERT INTO group_members (group_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [groupId, userId]
  )
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await query(
    `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  )
}

export async function deleteGroup(groupId: string): Promise<void> {
  await query(`DELETE FROM groups WHERE id = $1`, [groupId])
}

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  )
  return result.rows.length > 0
}

export async function isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM groups WHERE id = $1 AND admin_id = $2`,
    [groupId, userId]
  )
  return result.rows.length > 0
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const result = await query(
    `SELECT gm.* FROM group_members gm WHERE gm.group_id = $1`,
    [groupId]
  )
  return result.rows
}
