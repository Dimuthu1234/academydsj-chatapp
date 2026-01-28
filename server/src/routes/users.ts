import { Router, Response } from 'express'
import {
  findUserById,
  updateUser,
  searchUsers,
  toPublicUser,
} from '../models/User.js'
import { AuthRequest, authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query

    if (!q || typeof q !== 'string' || q.length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' })
      return
    }

    const users = await searchUsers(q, req.userId)
    res.json({ users: users.map(toPublicUser) })
  } catch (error) {
    console.error('Search users error:', error)
    res.status(500).json({ error: 'Failed to search users' })
  }
})

router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }
    res.json({ user: toPublicUser(req.user) })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

router.patch('/profile', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { displayName, avatarUrl, status } = req.body
    const updateData: Parameters<typeof updateUser>[1] = {}

    if (displayName) updateData.display_name = displayName
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl
    if (status) updateData.status = status

    const user = await updateUser(req.userId, updateData)
    res.json({ user: toPublicUser(user) })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const user = await findUserById(id)

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user: toPublicUser(user) })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

export default router
