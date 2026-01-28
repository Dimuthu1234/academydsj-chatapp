import React from 'react'
import { Phone } from 'lucide-react'
import { Avatar } from '@/components/Common/Avatar'
import { CallControls } from './CallControls'
import type { Call, User } from '@/types'

interface AudioCallProps {
  call: Call
  currentUser: User
  isMuted: boolean
  isRecording: boolean
  onToggleMute: () => void
  onStartRecording: () => void
  onStopRecording: () => void
  onEndCall: () => void
}

export const AudioCall: React.FC<AudioCallProps> = ({
  call,
  currentUser,
  isMuted,
  isRecording,
  onToggleMute,
  onStartRecording,
  onStopRecording,
  onEndCall,
}) => {
  const remoteParticipants = call.participants.filter(
    (p) => p.id !== currentUser.id
  )

  const mainParticipant = remoteParticipants[0]

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-bg-primary to-bg-secondary z-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center mb-8">
        {mainParticipant ? (
          <>
            <div className="relative mb-6">
              <Avatar
                src={mainParticipant.user.avatarUrl}
                size="xl"
                className="w-32 h-32"
              />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-1 bg-accent-primary rounded-full px-3 py-1">
                  <Phone size={14} className="text-bg-primary" />
                  <span className="text-xs text-bg-primary font-medium">
                    Connected
                  </span>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {mainParticipant.user.displayName}
            </h2>
            <p className="text-text-secondary">
              {call.status === 'ringing' ? 'Calling...' : 'Audio call'}
            </p>
          </>
        ) : (
          <>
            <div className="w-32 h-32 rounded-full bg-bg-tertiary flex items-center justify-center mb-6">
              <Phone size={48} className="text-accent-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Waiting for others
            </h2>
            <p className="text-text-secondary">
              Invite participants to join
            </p>
          </>
        )}
      </div>

      {remoteParticipants.length > 1 && (
        <div className="flex items-center justify-center space-x-3 mb-8">
          {remoteParticipants.slice(1, 4).map((participant) => (
            <div key={participant.id} className="flex flex-col items-center">
              <Avatar
                src={participant.user.avatarUrl}
                size="lg"
              />
              <span className="text-xs text-text-secondary mt-1 truncate max-w-[60px]">
                {participant.user.displayName}
              </span>
            </div>
          ))}
          {remoteParticipants.length > 4 && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center">
                <span className="text-sm text-text-primary font-medium">
                  +{remoteParticipants.length - 4}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto mb-16">
        <CallControls
          isMuted={isMuted}
          isVideoOff={true}
          isScreenSharing={false}
          isRecording={isRecording}
          onToggleMute={onToggleMute}
          onToggleVideo={() => {}}
          onToggleScreenShare={() => {}}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onEndCall={onEndCall}
        />
      </div>

      <div className="absolute top-4 right-4">
        <div className="bg-bg-secondary/80 backdrop-blur-sm rounded-lg px-4 py-2">
          <p className="text-lg font-semibold text-text-primary">
            {call.participants.length} participants
          </p>
        </div>
      </div>
    </div>
  )
}
