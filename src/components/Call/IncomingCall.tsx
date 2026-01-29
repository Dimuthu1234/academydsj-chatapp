import React from 'react'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { Avatar } from '@/components/Common/Avatar'
import type { Call } from '@/types'

interface IncomingCallProps {
  call: Call
  onAccept: () => void
  onReject: () => void
}

export const IncomingCall: React.FC<IncomingCallProps> = ({
  call,
  onAccept,
  onReject,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-bg-secondary rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-slide-in">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-accent-primary rounded-full animate-ping opacity-30" />
          <Avatar
            src={call.caller.avatarUrl}
            size="xl"
            className="w-24 h-24 relative"
          />
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {call.caller.displayName}
        </h2>
        <p className="text-text-secondary mb-8">
          Incoming {call.type === 'video' ? 'video' : 'audio'} call...
        </p>

        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={onReject}
            className="p-5 rounded-full bg-red-500 hover:bg-red-600 transition-colors transform hover:scale-105"
          >
            <PhoneOff size={28} className="text-white" />
          </button>

          <button
            onClick={onAccept}
            className="p-5 rounded-full bg-accent-primary hover:bg-accent-secondary transition-colors transform hover:scale-105"
          >
            {call.type === 'video' ? (
              <Video size={28} className="text-bg-primary" />
            ) : (
              <Phone size={28} className="text-bg-primary" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
