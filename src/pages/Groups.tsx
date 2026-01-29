import React, { useState } from 'react'
import { Header } from '@/components/Layout/Header'
import { GroupList } from '@/components/Groups/GroupList'
import { CreateGroup } from '@/components/Groups/CreateGroup'
import { useChat } from '@/hooks/useChat'
import type { Group, Chat } from '@/types'

export const Groups: React.FC = () => {
  const { chats, createGroup, searchUsers, setActiveChat, addChat } = useChat()
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  const groups = chats
    .filter((c): c is Chat & { group: Group } => c.type === 'group' && !!c.group)
    .map((c) => c.group)

  const handleSelectGroup = (group: Group) => {
    const chat = chats.find((c) => c.id === group.id)
    if (chat) {
      setActiveChat(chat)
    }
  }

  const handleCreateGroup = async (
    name: string,
    description: string,
    memberIds: string[]
  ) => {
    const group = await createGroup(name, description, memberIds)
    const newChat: Chat = {
      id: group.id,
      type: 'group',
      group,
      unreadCount: 0,
    }
    addChat(newChat)
    setActiveChat(newChat)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Groups" subtitle={`${groups.length} groups`} />

      <div className="flex-1 overflow-y-auto">
        <GroupList
          groups={groups}
          onSelectGroup={handleSelectGroup}
          onCreateGroup={() => setShowCreateGroup(true)}
        />
      </div>

      <CreateGroup
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
        onSearchUsers={searchUsers}
      />
    </div>
  )
}
