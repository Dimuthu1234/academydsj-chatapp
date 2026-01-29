import React, { useState } from 'react'
import { Trash2, UserPlus, Crown, MoreVertical } from 'lucide-react'
import { Modal } from '@/components/Common/Modal'
import { Button } from '@/components/Common/Button'
import { Input } from '@/components/Common/Input'
import { Avatar } from '@/components/Common/Avatar'
import type { Group, User } from '@/types'

interface GroupSettingsProps {
  isOpen: boolean
  onClose: () => void
  group: Group
  currentUser: User
  onUpdateGroup: (data: Partial<Group>) => Promise<void>
  onAddMember: (userId: string) => Promise<void>
  onRemoveMember: (userId: string) => Promise<void>
  onDeleteGroup: () => Promise<void>
}

export const GroupSettings: React.FC<GroupSettingsProps> = ({
  isOpen,
  onClose,
  group,
  currentUser,
  onUpdateGroup,
  onRemoveMember,
  onDeleteGroup,
}) => {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isAdmin = group.adminId === currentUser.id

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onUpdateGroup({ name, description })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await onDeleteGroup()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Group Settings"
      size="lg"
    >
      {showDeleteConfirm ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            Delete Group?
          </h3>
          <p className="text-text-secondary mb-6">
            This action cannot be undone. All messages and data will be
            permanently deleted.
          </p>
          <div className="flex justify-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isLoading}
            >
              Delete Group
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {isAdmin && (
            <div className="space-y-4">
              <Input
                label="Group Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary">
                Members ({group.members.length})
              </h3>
              {isAdmin && (
                <Button variant="ghost" size="sm" leftIcon={<UserPlus size={16} />}>
                  Add
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {group.members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={member.user.avatarUrl}
                      status={member.user.status}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-text-primary">
                          {member.user.displayName}
                        </span>
                        {member.userId === group.adminId && (
                          <Crown size={14} className="text-yellow-500" />
                        )}
                        {member.userId === currentUser.id && (
                          <span className="text-xs text-text-secondary">
                            (You)
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-text-secondary">
                        {member.user.email}
                      </span>
                    </div>
                  </div>
                  {isAdmin && member.userId !== currentUser.id && (
                    <button
                      onClick={() => onRemoveMember(member.userId)}
                      className="p-2 rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-red-500 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border-color">
            {isAdmin && (
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                leftIcon={<Trash2 size={16} />}
              >
                Delete Group
              </Button>
            )}
            <div className="flex space-x-3 ml-auto">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {isAdmin && (
                <Button onClick={handleSave} isLoading={isLoading}>
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
