import React, { useState } from 'react'
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Header } from '@/components/Layout/Header'
import { Avatar } from '@/components/Common/Avatar'

interface CallRecord {
  id: string
  type: 'audio' | 'video'
  direction: 'incoming' | 'outgoing' | 'missed'
  participant: {
    id: string
    displayName: string
    avatarUrl?: string
  }
  duration?: number
  timestamp: string
}

const mockCallHistory: CallRecord[] = [
  {
    id: '1',
    type: 'video',
    direction: 'outgoing',
    participant: {
      id: '2',
      displayName: 'John Smith',
    },
    duration: 1234,
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'audio',
    direction: 'incoming',
    participant: {
      id: '3',
      displayName: 'Sarah Johnson',
    },
    duration: 567,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    type: 'video',
    direction: 'missed',
    participant: {
      id: '4',
      displayName: 'Mike Williams',
    },
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
]

export const Calls: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'missed'>('all')

  const filteredCalls = filter === 'all'
    ? mockCallHistory
    : mockCallHistory.filter((call) => call.direction === 'missed')

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDirectionIcon = (direction: CallRecord['direction']) => {
    switch (direction) {
      case 'incoming':
        return <PhoneIncoming size={16} className="text-accent-primary" />
      case 'outgoing':
        return <PhoneOutgoing size={16} className="text-blue-400" />
      case 'missed':
        return <PhoneMissed size={16} className="text-red-400" />
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Calls" subtitle="Recent call history" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-2 mb-4 md:mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
                filter === 'all'
                  ? 'bg-accent-primary text-bg-primary'
                  : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              All Calls
            </button>
            <button
              onClick={() => setFilter('missed')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
                filter === 'missed'
                  ? 'bg-accent-primary text-bg-primary'
                  : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              Missed
            </button>
          </div>

          <div className="space-y-2 md:space-y-3">
            {filteredCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-3 md:p-4 bg-bg-secondary rounded-xl border border-border-color hover:border-accent-primary/30 transition-all"
              >
                <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                  <Avatar
                    src={call.participant.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-text-primary truncate">
                        {call.participant.displayName}
                      </span>
                      {getDirectionIcon(call.direction)}
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-3 mt-1 flex-wrap">
                      <span className="flex items-center space-x-1 text-xs md:text-sm text-text-secondary">
                        {call.type === 'video' ? (
                          <Video size={14} />
                        ) : (
                          <Phone size={14} />
                        )}
                        <span className="hidden sm:inline">{call.type === 'video' ? 'Video' : 'Audio'}</span>
                      </span>
                      {call.duration && (
                        <span className="flex items-center space-x-1 text-xs md:text-sm text-text-secondary">
                          <Clock size={14} />
                          <span>{formatDuration(call.duration)}</span>
                        </span>
                      )}
                      <span className="text-xs md:text-sm text-text-secondary md:hidden">
                        {format(new Date(call.timestamp), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                  <span className="text-sm text-text-secondary hidden md:block">
                    {format(new Date(call.timestamp), 'MMM d, h:mm a')}
                  </span>
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <button className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-accent-primary transition-colors touch-target">
                      <Phone size={18} />
                    </button>
                    <button className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-accent-primary transition-colors touch-target">
                      <Video size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredCalls.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                  <Phone size={32} className="text-text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  No calls yet
                </h3>
                <p className="text-text-secondary">
                  Your call history will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
