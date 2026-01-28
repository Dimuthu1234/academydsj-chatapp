import React, { useState, useCallback } from 'react'
import { X, Search, Check } from 'lucide-react'
import { Modal } from '@/components/Common/Modal'
import { Button } from '@/components/Common/Button'
import { Input } from '@/components/Common/Input'
import { Avatar } from '@/components/Common/Avatar'
import type { User } from '@/types'

interface CreateGroupProps {
  isOpen: boolean
  onClose: () => void
  onCreateGroup: (name: string, description: string, memberIds: string[]) => Promise<void>
  onSearchUsers: (query: string) => Promise<User[]>
}

export const CreateGroup: React.FC<CreateGroupProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  onSearchUsers,
}) => {
  const [step, setStep] = useState<'details' | 'members'>(1 === 1 ? 'details' : 'members')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query)
      if (query.length < 2) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const users = await onSearchUsers(query)
        setSearchResults(users)
      } finally {
        setIsSearching(false)
      }
    },
    [onSearchUsers]
  )

  const toggleMember = useCallback((user: User) => {
    setSelectedMembers((prev) => {
      const isSelected = prev.some((m) => m.id === user.id)
      if (isSelected) {
        return prev.filter((m) => m.id !== user.id)
      }
      return [...prev, user]
    })
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setIsLoading(true)
    try {
      await onCreateGroup(
        name.trim(),
        description.trim(),
        selectedMembers.map((m) => m.id)
      )
      handleClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('details')
    setName('')
    setDescription('')
    setSearchQuery('')
    setSearchResults([])
    setSelectedMembers([])
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Group" size="lg">
      {step === 'details' ? (
        <div className="space-y-4">
          <Input
            label="Group Name"
            placeholder="Enter group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Description (optional)
            </label>
            <textarea
              placeholder="Enter group description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => setStep('members')}
              disabled={!name.trim()}
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="Search users to add..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />

          {selectedMembers.length > 0 && (
            <div>
              <p className="text-sm text-text-secondary mb-2">
                Selected ({selectedMembers.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2 bg-accent-primary/20 rounded-full pl-1 pr-2 py-1"
                  >
                    <Avatar src={member.avatarUrl} size="sm" />
                    <span className="text-sm text-text-primary">
                      {member.displayName}
                    </span>
                    <button
                      onClick={() => toggleMember(member)}
                      className="p-0.5 rounded-full hover:bg-accent-primary/30 transition-colors"
                    >
                      <X size={14} className="text-text-secondary" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-1">
            {isSearching ? (
              <div className="text-center py-8 text-text-secondary">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => {
                const isSelected = selectedMembers.some(
                  (m) => m.id === user.id
                )
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleMember(user)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-accent-primary/20'
                        : 'hover:bg-bg-tertiary'
                    }`}
                  >
                    <Avatar src={user.avatarUrl} status={user.status} />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-text-primary">
                        {user.displayName}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {user.email}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={20} className="text-accent-primary" />
                    )}
                  </button>
                )
              })
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-text-secondary">
                No users found
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                Search for users to add to the group
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-border-color">
            <Button variant="ghost" onClick={() => setStep('details')}>
              Back
            </Button>
            <div className="flex space-x-3">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} isLoading={isLoading}>
                Create Group
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
