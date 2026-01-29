import { Router, Response } from 'express'
import {
  createUser,
  findUserByEmail,
  verifyPassword,
  toPublicUser,
} from '../models/User.js'
import { generateToken, AuthRequest, authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, displayName } = req.body

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Email, password, and display name are required' })
      return
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' })
      return
    }

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' })
      return
    }

    const user = await createUser(email, password, displayName)
    const token = generateToken(user.id)

    res.status(201).json({
      user: toPublicUser(user),
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const user = await findUserByEmail(email)
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const isValidPassword = await verifyPassword(user, password)
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = generateToken(user.id)

    res.json({
      user: toPublicUser(user),
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }
    res.json({ user: toPublicUser(req.user) })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

export default router
