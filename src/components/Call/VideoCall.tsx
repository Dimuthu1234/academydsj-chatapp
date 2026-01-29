import React, { useMemo } from 'react'
import { ParticipantVideo } from './ParticipantVideo'
import { CallControls } from './CallControls'
import { ScreenShare } from './ScreenShare'
import type { Call, User } from '@/types'

interface VideoCallProps {
  call: Call
  localStream: MediaStream | null
  currentUser: User
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  isRecording: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onStartRecording: () => void
  onStopRecording: () => void
  onEndCall: () => void
}

export const VideoCall: React.FC<VideoCallProps> = ({
  call,
  localStream,
  currentUser,
  isMuted,
  isVideoOff,
  isScreenSharing,
  isRecording,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onStartRecording,
  onStopRecording,
  onEndCall,
}) => {
  const localParticipant = useMemo(
    () => ({
      id: currentUser.id,
      peerId: currentUser.id,
      user: currentUser,
      stream: localStream || undefined,
      isMuted,
      isVideoOff,
      isScreenSharing,
    }),
    [currentUser, localStream, isMuted, isVideoOff, isScreenSharing]
  )

  const remoteParticipants = call.participants.filter(
    (p) => p.id !== currentUser.id
  )

  const screenSharingParticipant = call.participants.find(
    (p) => p.isScreenSharing && p.stream
  )

  const totalParticipants = remoteParticipants.length + 1

  const getGridClass = () => {
    if (screenSharingParticipant) return 'video-grid-1'
    if (totalParticipants <= 1) return 'video-grid-1'
    if (totalParticipants === 2) return 'video-grid-2'
    if (totalParticipants <= 4) return 'video-grid-4'
    if (totalParticipants <= 6) return 'video-grid-6'
    return 'video-grid-9'
  }

  return (
    <div className="fixed inset-0 bg-bg-primary z-50 flex flex-col">
      <div className="flex-1 p-4 relative">
        {screenSharingParticipant?.stream ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 mb-4">
              <ScreenShare
                stream={screenSharingParticipant.stream}
                userName={screenSharingParticipant.user.displayName}
              />
            </div>
            <div className="h-32 flex space-x-2 overflow-x-auto pb-2">
              <div className="w-48 flex-shrink-0">
                <ParticipantVideo
                  participant={localParticipant}
                  isLocal
                />
              </div>
              {remoteParticipants.map((participant) => (
                <div key={participant.id} className="w-48 flex-shrink-0">
                  <ParticipantVideo participant={participant} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`grid ${getGridClass()} gap-4 h-full`}>
            <ParticipantVideo
              participant={localParticipant}
              isLocal
            />
            {remoteParticipants.map((participant) => (
              <ParticipantVideo
                key={participant.id}
                participant={participant}
              />
            ))}
          </div>
        )}

        <CallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          isRecording={isRecording}
          onToggleMute={onToggleMute}
          onToggleVideo={onToggleVideo}
          onToggleScreenShare={onToggleScreenShare}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onEndCall={onEndCall}
        />
      </div>

      <div className="absolute top-4 left-4 flex items-center space-x-4">
        <div className="bg-bg-secondary/80 backdrop-blur-sm rounded-lg px-4 py-2">
          <p className="text-sm text-text-secondary">
            {call.type === 'video' ? 'Video Call' : 'Audio Call'}
          </p>
          <p className="text-lg font-semibold text-text-primary">
            {call.participants.length} participants
          </p>
        </div>
      </div>
    </div>
  )
}
