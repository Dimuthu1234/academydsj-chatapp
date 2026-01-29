import { create } from 'zustand'
import type { Chat, Message, ChatState, User, Group } from '@/types'
import { api } from '@/services/api'

interface ChatStore extends ChatState {
  setChats: (chats: Chat[]) => void
  addChat: (chat: Chat) => void
  setActiveChat: (chat: Chat | null) => void
  setMessages: (chatId: string, messages: Message[]) => void
  addMessage: (chatId: string, message: Message) => void
  updateMessage: (chatId: string, messageId: string, data: Partial<Message>) => void
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void
  markAsRead: (chatId: string) => void
  fetchChats: () => Promise<void>
  fetchMessages: (chatId: string) => Promise<void>
  sendMessage: (chatId: string, content: string, type?: Message['messageType'], fileUrl?: string, fileName?: string) => Promise<void>
  createGroup: (name: string, description: string, memberIds: string[]) => Promise<Group>
  addGroupMember: (groupId: string, userId: string) => Promise<void>
  removeGroupMember: (groupId: string, userId: string) => Promise<void>
  searchUsers: (query: string) => Promise<User[]>
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: {},
  isLoading: false,

  setChats: (chats: Chat[]) => {
    set({ chats })
  },

  addChat: (chat: Chat) => {
    set((state) => ({
      chats: [chat, ...state.chats.filter((c) => c.id !== chat.id)],
    }))
  },

  setActiveChat: (chat: Chat | null) => {
    set({ activeChat: chat })
    if (chat) {
      get().markAsRead(chat.id)
    }
  },

  setMessages: (chatId: string, messages: Message[]) => {
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    }))
  },

  addMessage: (chatId: string, message: Message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, lastMessage: message, unreadCount: chat.unreadCount + 1 }
          : chat
      ),
    }))
  },

  updateMessage: (chatId: string, messageId: string, data: Partial<Message>) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, ...data } : msg
        ),
      },
    }))
  },

  setTyping: (chatId: string, userId: string, isTyping: boolean) => {
    set((state) => {
      const currentTyping = state.typingUsers[chatId] || []
      const newTyping = isTyping
        ? [...new Set([...currentTyping, userId])]
        : currentTyping.filter((id) => id !== userId)
      return {
        typingUsers: { ...state.typingUsers, [chatId]: newTyping },
      }
    })
  },

  markAsRead: (chatId: string) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      ),
    }))
  },

  fetchChats: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get('/chats')
      set({ chats: response.data.chats, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch chats:', error)
      set({ isLoading: false })
    }
  },

  fetchMessages: async (chatId: string) => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`)
      set((state) => ({
        messages: { ...state.messages, [chatId]: response.data.messages },
      }))
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  },

  sendMessage: async (
    chatId: string,
    content: string,
    type: Message['messageType'] = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    try {
      const response = await api.post(`/chats/${chatId}/messages`, {
        content,
        messageType: type,
        fileUrl,
        fileName,
      })
      get().addMessage(chatId, response.data.message)
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  },

  createGroup: async (name: string, description: string, memberIds: string[]) => {
    try {
      const response = await api.post('/groups', { name, description, memberIds })
      const group = response.data.group
      const chat: Chat = {
        id: group.id,
        type: 'group',
        group,
        unreadCount: 0,
      }
      get().addChat(chat)
      return group
    } catch (error) {
      console.error('Failed to create group:', error)
      throw error
    }
  },

  addGroupMember: async (groupId: string, userId: string) => {
    try {
      await api.post(`/groups/${groupId}/members`, { userId })
    } catch (error) {
      console.error('Failed to add member:', error)
      throw error
    }
  },

  removeGroupMember: async (groupId: string, userId: string) => {
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`)
    } catch (error) {
      console.error('Failed to remove member:', error)
      throw error
    }
  },

  searchUsers: async (query: string) => {
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`)
      return response.data.users
    } catch (error) {
      console.error('Failed to search users:', error)
      return []
    }
  },
}))
