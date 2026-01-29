import { io, Socket } from 'socket.io-client'
import type { Message, Call, User } from '@/types'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(token: string) {
    if (this.socket?.connected) return

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      upgrade: true,
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.reconnectAttempts++
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket
  }

  // Chat events
  joinChat(chatId: string) {
    this.socket?.emit('chat:join', chatId)
  }

  leaveChat(chatId: string) {
    this.socket?.emit('chat:leave', chatId)
  }

  sendMessage(chatId: string, message: Partial<Message>) {
    this.socket?.emit('chat:message', { chatId, message })
  }

  onMessage(callback: (message: Message) => void) {
    this.socket?.on('chat:message', callback)
    return () => this.socket?.off('chat:message', callback)
  }

  sendTyping(chatId: string, isTyping: boolean) {
    this.socket?.emit('chat:typing', { chatId, isTyping })
  }

  onTyping(callback: (data: { chatId: string; userId: string; isTyping: boolean }) => void) {
    this.socket?.on('chat:typing', callback)
    return () => this.socket?.off('chat:typing', callback)
  }

  onMessageRead(callback: (data: { chatId: string; messageId: string; readAt: string }) => void) {
    this.socket?.on('chat:read', callback)
    return () => this.socket?.off('chat:read', callback)
  }

  // Call events
  initiateCall(call: Partial<Call>) {
    // Extract the target user ID from participants (not the caller)
    const targetUserId = call.participants?.find(p => p.id !== call.callerId)?.id
    this.socket?.emit('call:initiate', {
      type: call.type,
      targetUserId,
      groupId: call.participants && call.participants.length > 2 ? call.id : undefined,
    })
  }

  acceptCall(callId: string) {
    this.socket?.emit('call:accept', callId)
  }

  rejectCall(callId: string) {
    this.socket?.emit('call:reject', callId)
  }

  endCall(callId: string) {
    this.socket?.emit('call:end', callId)
  }

  onIncomingCall(callback: (call: Call) => void) {
    this.socket?.on('call:incoming', callback)
    return () => this.socket?.off('call:incoming', callback)
  }

  onCallAccepted(callback: (callId: string) => void) {
    this.socket?.on('call:accepted', callback)
    return () => this.socket?.off('call:accepted', callback)
  }

  onCallRejected(callback: (callId: string) => void) {
    this.socket?.on('call:rejected', callback)
    return () => this.socket?.off('call:rejected', callback)
  }

  onCallEnded(callback: (callId: string) => void) {
    this.socket?.on('call:ended', callback)
    return () => this.socket?.off('call:ended', callback)
  }

  // WebRTC signaling
  sendSignal(targetId: string, signal: unknown) {
    this.socket?.emit('webrtc:signal', { targetId, signal })
  }

  onSignal(callback: (data: { senderId: string; signal: unknown }) => void) {
    this.socket?.on('webrtc:signal', callback)
    return () => this.socket?.off('webrtc:signal', callback)
  }

  // User presence
  updateStatus(status: User['status']) {
    this.socket?.emit('user:status', status)
  }

  onUserStatusChange(callback: (data: { userId: string; status: User['status'] }) => void) {
    this.socket?.on('user:status', callback)
    return () => this.socket?.off('user:status', callback)
  }

  onUserOnline(callback: (userId: string) => void) {
    this.socket?.on('user:online', callback)
    return () => this.socket?.off('user:online', callback)
  }

  onUserOffline(callback: (userId: string) => void) {
    this.socket?.on('user:offline', callback)
    return () => this.socket?.off('user:offline', callback)
  }

  // Meeting events
  onMeetingStarted(callback: (data: {
    callId: string
    type: 'audio' | 'video'
    groupId?: string
    groupName?: string
    hostId: string
    hostName: string
  }) => void) {
    this.socket?.on('meeting:started', callback)
    return () => this.socket?.off('meeting:started', callback)
  }
}

export const socketService = new SocketService()
