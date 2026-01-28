import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { findUserById, User } from '../models/User.js'

export interface AuthRequest extends Request {
  user?: User
  userId?: string
}

export interface JWTPayload {
  userId: string
  iat: number
  exp: number
}

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'default-secret'
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(
    token,
    process.env.JWT_SECRET || 'default-secret'
  ) as JWTPayload
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' })
      return
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    const user = await findUserById(decoded.userId)

    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    req.user = user
    req.userId = user.id
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function socketAuthMiddleware(token: string): Promise<User | null> {
  return new Promise((resolve) => {
    try {
      const decoded = verifyToken(token)
      findUserById(decoded.userId).then(resolve).catch(() => resolve(null))
    } catch {
      resolve(null)
    }
  })
}
