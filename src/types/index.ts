export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  status: 'online' | 'offline' | 'away' | 'busy'
  createdAt: string
}

export interface Message {
  id: string
  senderId: string
  receiverId?: string
  groupId?: string
  content: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  messageType: 'text' | 'image' | 'file' | 'video' | 'audio'
  createdAt: string
  readAt?: string
}

export interface Group {
  id: string
  name: string
  description?: string
  avatarUrl?: string
  adminId: string
  members: GroupMember[]
  createdAt: string
}

export interface GroupMember {
  userId: string
  user: User
  joinedAt: string
}

export interface Chat {
  id: string
  type: 'direct' | 'group'
  participant?: User
  group?: Group
  lastMessage?: Message
  unreadCount: number
}

export interface Call {
  id: string
  type: 'audio' | 'video'
  status: 'ringing' | 'ongoing' | 'ended'
  callerId: string
  caller: User
  participants: CallParticipant[]
  groupId?: string
  startedAt?: string
  endedAt?: string
}

export interface CallParticipant {
  id: string
  peerId: string
  user: User
  stream?: MediaStream
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
}

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
}

export interface FileUpload {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
}

export interface TypingIndicator {
  chatId: string
  userId: string
  isTyping: boolean
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface ChatState {
  chats: Chat[]
  activeChat: Chat | null
  messages: Record<string, Message[]>
  typingUsers: Record<string, string[]>
  isLoading: boolean
}

export interface CallState {
  currentCall: Call | null
  incomingCall: Call | null
  localStream: MediaStream | null
  isRecording: boolean
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
}

declare global {
  interface Window {
    electronAPI?: {
      getSources: () => Promise<ScreenSource[]>
      saveRecording: (buffer: ArrayBuffer, filename: string) => Promise<{
        success: boolean
        path?: string
      }>
      getAppVersion: () => Promise<string>
    }
  }
}
