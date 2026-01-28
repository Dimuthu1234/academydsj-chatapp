import React from 'react'
import { Plus, Users } from 'lucide-react'
import { Avatar } from '@/components/Common/Avatar'
import type { Group } from '@/types'

interface GroupListProps {
  groups: Group[]
  onSelectGroup: (group: Group) => void
  onCreateGroup: () => void
}

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  onSelectGroup,
  onCreateGroup,
}) => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">Groups</h2>
        <button
          onClick={onCreateGroup}
          className="flex items-center space-x-2 px-4 py-2 bg-accent-primary hover:bg-accent-secondary rounded-lg transition-colors"
        >
          <Plus size={18} className="text-bg-primary" />
          <span className="text-bg-primary font-medium">Create</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group)}
            className="p-4 bg-bg-secondary rounded-xl border border-border-color hover:border-accent-primary/50 transition-all duration-200 text-left group"
          >
            <div className="flex items-start space-x-4">
              <Avatar src={group.avatarUrl} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary truncate group-hover:text-accent-primary transition-colors">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                    {group.description}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-3 text-text-secondary">
                  <Users size={14} />
                  <span className="text-sm">
                    {group.members.length} members
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}

        {groups.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No groups yet
            </h3>
            <p className="text-text-secondary mb-4">
              Create a group to start chatting with multiple people
            </p>
            <button
              onClick={onCreateGroup}
              className="px-6 py-2 bg-accent-primary hover:bg-accent-secondary rounded-lg text-bg-primary font-medium transition-colors"
            >
              Create your first group
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
