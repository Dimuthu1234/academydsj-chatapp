import React, { useEffect, useRef } from 'react'
import { MicOff, VideoOff } from 'lucide-react'
import { Avatar } from '@/components/Common/Avatar'
import type { CallParticipant } from '@/types'

interface ParticipantVideoProps {
  participant: CallParticipant
  isLocal?: boolean
  isSpeaking?: boolean
}

export const ParticipantVideo: React.FC<ParticipantVideoProps> = ({
  participant,
  isLocal = false,
  isSpeaking = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream
    }
  }, [participant.stream])

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-bg-tertiary ${
        isSpeaking ? 'ring-2 ring-accent-primary' : ''
      }`}
    >
      {participant.stream && !participant.isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center min-h-[200px]">
          <Avatar
            src={participant.user.avatarUrl}
            size="xl"
          />
        </div>
      )}

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-sm text-white font-medium truncate max-w-[120px]">
            {isLocal ? 'You' : participant.user.displayName}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {participant.isMuted && (
            <div className="p-1.5 bg-red-500 rounded-lg">
              <MicOff size={14} className="text-white" />
            </div>
          )}
          {participant.isVideoOff && (
            <div className="p-1.5 bg-red-500 rounded-lg">
              <VideoOff size={14} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {isLocal && (
        <div className="absolute top-3 right-3 bg-accent-primary/80 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-xs text-bg-primary font-medium">You</span>
        </div>
      )}
    </div>
  )
}
