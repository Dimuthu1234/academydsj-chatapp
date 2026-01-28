import { Router, Response } from 'express'
import {
  createGroup,
  getGroupById,
  getUserGroups,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  deleteGroup,
  isGroupAdmin,
  isGroupMember,
  toPublicGroup,
} from '../models/Group.js'
import { AuthRequest, authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const groups = await getUserGroups(req.userId)
    res.json({ groups: groups.map(toPublicGroup) })
  } catch (error) {
    console.error('Get groups error:', error)
    res.status(500).json({ error: 'Failed to get groups' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { name, description, memberIds = [] } = req.body

    if (!name) {
      res.status(400).json({ error: 'Group name is required' })
      return
    }

    const group = await createGroup(name, description, req.userId, memberIds)
    res.status(201).json({ group: toPublicGroup(group) })
  } catch (error) {
    console.error('Create group error:', error)
    res.status(500).json({ error: 'Failed to create group' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id } = req.params
    const group = await getGroupById(id)

    if (!group) {
      res.status(404).json({ error: 'Group not found' })
      return
    }

    const isMember = await isGroupMember(id, req.userId)
    if (!isMember) {
      res.status(403).json({ error: 'Not a member of this group' })
      return
    }

    res.json({ group: toPublicGroup(group) })
  } catch (error) {
    console.error('Get group error:', error)
    res.status(500).json({ error: 'Failed to get group' })
  }
})

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id } = req.params
    const { name, description, avatarUrl } = req.body

    const isAdmin = await isGroupAdmin(id, req.userId)
    if (!isAdmin) {
      res.status(403).json({ error: 'Only group admin can update group' })
      return
    }

    const updateData: Parameters<typeof updateGroup>[1] = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl

    await updateGroup(id, updateData)
    const group = await getGroupById(id)

    res.json({ group: toPublicGroup(group!) })
  } catch (error) {
    console.error('Update group error:', error)
    res.status(500).json({ error: 'Failed to update group' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id } = req.params

    const isAdmin = await isGroupAdmin(id, req.userId)
    if (!isAdmin) {
      res.status(403).json({ error: 'Only group admin can delete group' })
      return
    }

    await deleteGroup(id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete group error:', error)
    res.status(500).json({ error: 'Failed to delete group' })
  }
})

router.post('/:id/members', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id } = req.params
    const { userId } = req.body

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' })
      return
    }

    const isAdmin = await isGroupAdmin(id, req.userId)
    if (!isAdmin) {
      res.status(403).json({ error: 'Only group admin can add members' })
      return
    }

    await addGroupMember(id, userId)
    const group = await getGroupById(id)

    res.json({ group: toPublicGroup(group!) })
  } catch (error) {
    console.error('Add member error:', error)
    res.status(500).json({ error: 'Failed to add member' })
  }
})

router.delete('/:id/members/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id, userId } = req.params

    const isAdmin = await isGroupAdmin(id, req.userId)
    const isSelf = userId === req.userId

    if (!isAdmin && !isSelf) {
      res.status(403).json({ error: 'Not authorized to remove this member' })
      return
    }

    await removeGroupMember(id, userId)

    if (isSelf && !isAdmin) {
      res.json({ success: true })
      return
    }

    const group = await getGroupById(id)
    res.json({ group: group ? toPublicGroup(group) : null })
  } catch (error) {
    console.error('Remove member error:', error)
    res.status(500).json({ error: 'Failed to remove member' })
  }
})

export default router
