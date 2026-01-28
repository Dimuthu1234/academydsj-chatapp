import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

interface AuthenticatedSocket extends Socket {
  userId?: string
}

interface Call {
  id: string
  type: 'audio' | 'video'
  status: 'ringing' | 'ongoing' | 'ended'
  callerId: string
  participants: string[]
  groupId?: string
  startedAt?: Date
  endedAt?: Date
}

const activeCalls = new Map<string, Call>()

export function setupCallHandlers(
  io: Server,
  socket: AuthenticatedSocket,
  userId: string
) {
  socket.on('call:initiate', (data: {
    type: 'audio' | 'video'
    targetUserId?: string
    groupId?: string
    participants?: string[]
  }) => {
    const { type, targetUserId, groupId, participants = [] } = data

    const callId = uuidv4()
    const call: Call = {
      id: callId,
      type,
      status: 'ringing',
      callerId: userId,
      participants: targetUserId ? [userId, targetUserId] : [userId, ...participants],
      groupId,
    }

    activeCalls.set(callId, call)

    const targetUsers = call.participants.filter((id) => id !== userId)

    targetUsers.forEach((targetId) => {
      io.to(`user:${targetId}`).emit('call:incoming', {
        id: callId,
        type,
        status: 'ringing',
        callerId: userId,
        participants: call.participants,
        groupId,
      })
    })

    socket.emit('call:initiated', { callId })

    console.log(`Call ${callId} initiated by ${userId}`)
  })

  socket.on('call:accept', (callId: string) => {
    const call = activeCalls.get(callId)

    if (!call) {
      socket.emit('error', { message: 'Call not found' })
      return
    }

    call.status = 'ongoing'
    call.startedAt = new Date()

    call.participants.forEach((participantId) => {
      io.to(`user:${participantId}`).emit('call:accepted', callId)
    })

    console.log(`Call ${callId} accepted by ${userId}`)
  })

  socket.on('call:reject', (callId: string) => {
    const call = activeCalls.get(callId)

    if (!call) {
      socket.emit('error', { message: 'Call not found' })
      return
    }

    call.status = 'ended'
    call.endedAt = new Date()

    call.participants.forEach((participantId) => {
      io.to(`user:${participantId}`).emit('call:rejected', callId)
    })

    activeCalls.delete(callId)

    console.log(`Call ${callId} rejected by ${userId}`)
  })

  socket.on('call:end', (callId: string) => {
    const call = activeCalls.get(callId)

    if (!call) {
      socket.emit('error', { message: 'Call not found' })
      return
    }

    call.status = 'ended'
    call.endedAt = new Date()

    call.participants.forEach((participantId) => {
      io.to(`user:${participantId}`).emit('call:ended', callId)
    })

    activeCalls.delete(callId)

    console.log(`Call ${callId} ended by ${userId}`)
  })

  socket.on('webrtc:signal', (data: { targetId: string; signal: unknown }) => {
    const { targetId, signal } = data

    io.to(`user:${targetId}`).emit('webrtc:signal', {
      senderId: userId,
      signal,
    })
  })

  socket.on('call:join', (callId: string) => {
    const call = activeCalls.get(callId)

    if (!call) {
      socket.emit('error', { message: 'Call not found' })
      return
    }

    if (!call.participants.includes(userId)) {
      call.participants.push(userId)
    }

    call.participants.forEach((participantId) => {
      if (participantId !== userId) {
        io.to(`user:${participantId}`).emit('call:participant:joined', {
          callId,
          userId,
        })
      }
    })

    console.log(`User ${userId} joined call ${callId}`)
  })

  socket.on('call:leave', (callId: string) => {
    const call = activeCalls.get(callId)

    if (!call) return

    call.participants = call.participants.filter((id) => id !== userId)

    call.participants.forEach((participantId) => {
      io.to(`user:${participantId}`).emit('call:participant:left', {
        callId,
        userId,
      })
    })

    if (call.participants.length <= 1) {
      call.status = 'ended'
      call.endedAt = new Date()

      call.participants.forEach((participantId) => {
        io.to(`user:${participantId}`).emit('call:ended', callId)
      })

      activeCalls.delete(callId)
    }

    console.log(`User ${userId} left call ${callId}`)
  })

  // Handle meeting start (for group calls)
  socket.on('meeting:start', async (data: {
    callId: string
    type: 'audio' | 'video'
    groupId?: string
    groupName?: string
    hostId: string
    hostName: string
  }) => {
    const { callId, type, groupId, groupName, hostId, hostName } = data

    if (groupId) {
      // Notify all group members about the meeting
      const { getGroupMembers } = await import('../models/Group.js')
      const members = await getGroupMembers(groupId)

      members.forEach((member) => {
        if (member.user_id !== userId) {
          io.to(`user:${member.user_id}`).emit('meeting:started', {
            callId,
            type,
            groupId,
            groupName,
            hostId,
            hostName,
          })
        }
      })
    }

    console.log(`Meeting ${callId} started by ${hostName} in ${groupName || 'direct call'}`)
  })

  socket.on('disconnect', () => {
    activeCalls.forEach((call, callId) => {
      if (call.participants.includes(userId)) {
        call.participants = call.participants.filter((id) => id !== userId)

        call.participants.forEach((participantId) => {
          io.to(`user:${participantId}`).emit('call:participant:left', {
            callId,
            userId,
          })
        })

        if (call.participants.length <= 1) {
          call.status = 'ended'
          call.endedAt = new Date()

          call.participants.forEach((participantId) => {
            io.to(`user:${participantId}`).emit('call:ended', callId)
          })

          activeCalls.delete(callId)
        }
      }
    })
  })
}
