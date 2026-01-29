import React, { useEffect, useState, useCallback } from 'react'
import { Search, Plus, MessageSquare } from 'lucide-react'
import { Header } from '@/components/Layout/Header'
import { ChatList } from '@/components/Chat/ChatList'
import { ChatWindow } from '@/components/Chat/ChatWindow'
import { VideoCall } from '@/components/Call/VideoCall'
import { AudioCall } from '@/components/Call/AudioCall'
import { IncomingCall } from '@/components/Call/IncomingCall'
import { Modal } from '@/components/Common/Modal'
import { Input } from '@/components/Common/Input'
import { Avatar } from '@/components/Common/Avatar'
import { Button } from '@/components/Common/Button'
import { useChat } from '@/hooks/useChat'
import { useCall } from '@/hooks/useCall'
import { useAuthStore } from '@/stores/authStore'
import type { User, Chat } from '@/types'

export const Home: React.FC = () => {
  const { user } = useAuthStore()
  const {
    chats,
    activeChat,
    messages,
    typingUsers,
    setActiveChat,
    fetchChats,
    sendMessage,
    onTyping,
    searchUsers,
    addChat,
  } = useChat()

  const {
    currentCall,
    incomingCall,
    localStream,
    isRecording,
    isMuted,
    isVideoOff,
    isScreenSharing,
    initiateCall,
    startMeeting,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startRecording,
    stopRecording,
  } = useCall()

  const [showNewChat, setShowNewChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  // Mobile: track if showing chat window (vs list)
  const [showMobileChat, setShowMobileChat] = useState(false)

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query)
      if (query.length < 2) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const users = await searchUsers(query)
        setSearchResults(users.filter((u) => u.id !== user?.id))
      } finally {
        setIsSearching(false)
      }
    },
    [searchUsers, user?.id]
  )

  const handleStartChat = (targetUser: User) => {
    const existingChat = chats.find(
      (c) => c.type === 'direct' && c.participant?.id === targetUser.id
    )
    if (existingChat) {
      setActiveChat(existingChat)
    } else {
      const newChat: Chat = {
        id: targetUser.id,
        type: 'direct',
        participant: targetUser,
        unreadCount: 0,
      }
      addChat(newChat)
      setActiveChat(newChat)
    }
    setShowNewChat(false)
    setSearchQuery('')
    setSearchResults([])
    setShowMobileChat(true)
  }

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat)
    setShowMobileChat(true)
  }

  const handleBackToList = () => {
    setShowMobileChat(false)
  }

  const handleVideoCall = () => {
    if (activeChat?.type === 'group') {
      // Start a group video meeting
      startMeeting('video', activeChat.id, activeChat.group?.name)
    } else if (activeChat?.participant) {
      initiateCall(activeChat.participant, 'video')
    }
  }

  const handleAudioCall = () => {
    if (activeChat?.type === 'group') {
      // Start a group audio meeting
      startMeeting('audio', activeChat.id, activeChat.group?.name)
    } else if (activeChat?.participant) {
      initiateCall(activeChat.participant, 'audio')
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-full">
      {/* Desktop header - hidden on mobile when viewing chat */}
      <div className={`${showMobileChat ? 'hidden md:block' : ''}`}>
        <Header
          title="Messages"
          subtitle={`${chats.length} conversations`}
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setShowNewChat(true)}
            >
              <span className="hidden sm:inline">New Chat</span>
              <span className="sm:hidden">New</span>
            </Button>
          }
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat List - hidden on mobile when chat is open */}
        <div className={`${showMobileChat ? 'hidden md:block' : 'w-full md:w-auto'}`}>
          <ChatList
            chats={chats}
            activeChat={activeChat}
            onSelectChat={handleSelectChat}
          />
        </div>

        {/* Chat Window or Empty State */}
        <div className={`flex-1 ${!showMobileChat && activeChat ? 'hidden md:flex' : 'flex'} flex-col`}>
          {activeChat ? (
            <ChatWindow
              chat={activeChat}
              messages={messages}
              currentUser={user}
              typingUsers={typingUsers}
              onSendMessage={sendMessage}
              onTyping={onTyping}
              onVideoCall={handleVideoCall}
              onAudioCall={handleAudioCall}
              onBack={handleBackToList}
              showBackButton={showMobileChat}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-bg-primary hidden md:flex">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={40} className="text-text-secondary" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Select a conversation
                </h2>
                <p className="text-text-secondary mb-4">
                  Choose a chat from the list or start a new one
                </p>
                <Button onClick={() => setShowNewChat(true)} leftIcon={<Plus size={18} />}>
                  New Conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showNewChat}
        onClose={() => {
          setShowNewChat(false)
          setSearchQuery('')
          setSearchResults([])
        }}
        title="New Conversation"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />

          <div className="max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-8 text-text-secondary">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleStartChat(result)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-tertiary transition-colors"
                  >
                    <Avatar src={result.avatarUrl} status={result.status} />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-text-primary">
                        {result.displayName}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {result.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-text-secondary">
                No users found
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        </div>
      </Modal>

      {incomingCall && (
        <IncomingCall
          call={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {currentCall && currentCall.type === 'video' && (
        <VideoCall
          call={currentCall}
          localStream={localStream}
          currentUser={user}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          isRecording={isRecording}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onEndCall={endCall}
        />
      )}

      {currentCall && currentCall.type === 'audio' && (
        <AudioCall
          call={currentCall}
          currentUser={user}
          isMuted={isMuted}
          isRecording={isRecording}
          onToggleMute={toggleMute}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onEndCall={endCall}
        />
      )}
    </div>
  )
}
