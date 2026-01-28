import React from 'react'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Circle,
  StopCircle,
  MoreVertical,
} from 'lucide-react'

interface CallControlsProps {
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

export const CallControls: React.FC<CallControlsProps> = ({
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
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
      <div className="flex items-center space-x-3 bg-bg-secondary/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl border border-border-color">
        <button
          onClick={onToggleMute}
          className={`call-control-btn ${
            isMuted
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-bg-tertiary hover:bg-border-color'
          }`}
        >
          {isMuted ? (
            <MicOff size={22} className="text-white" />
          ) : (
            <Mic size={22} className="text-white" />
          )}
        </button>

        <button
          onClick={onToggleVideo}
          className={`call-control-btn ${
            isVideoOff
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-bg-tertiary hover:bg-border-color'
          }`}
        >
          {isVideoOff ? (
            <VideoOff size={22} className="text-white" />
          ) : (
            <Video size={22} className="text-white" />
          )}
        </button>

        <button
          onClick={onToggleScreenShare}
          className={`call-control-btn ${
            isScreenSharing
              ? 'bg-accent-primary hover:bg-accent-secondary'
              : 'bg-bg-tertiary hover:bg-border-color'
          }`}
        >
          {isScreenSharing ? (
            <MonitorOff size={22} className="text-bg-primary" />
          ) : (
            <Monitor size={22} className="text-white" />
          )}
        </button>

        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`call-control-btn ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-bg-tertiary hover:bg-border-color'
          }`}
        >
          {isRecording ? (
            <StopCircle size={22} className="text-white" />
          ) : (
            <Circle size={22} className="text-white" />
          )}
        </button>

        <div className="w-px h-8 bg-border-color mx-2" />

        <button
          onClick={onEndCall}
          className="call-control-btn bg-red-500 hover:bg-red-600 px-8"
        >
          <PhoneOff size={22} className="text-white" />
        </button>

        <button className="call-control-btn bg-bg-tertiary hover:bg-border-color">
          <MoreVertical size={22} className="text-white" />
        </button>
      </div>

      {isRecording && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 bg-red-500 rounded-full px-4 py-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm text-white font-medium">Recording</span>
          </div>
        </div>
      )}
    </div>
  )
}
