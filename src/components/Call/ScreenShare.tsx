import React, { useEffect, useRef } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

interface ScreenShareProps {
  stream: MediaStream
  userName: string
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export const ScreenShare: React.FC<ScreenShareProps> = ({
  stream,
  userName,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div
      className={`relative bg-bg-tertiary rounded-xl overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50' : 'w-full h-full'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />

      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
        <span className="text-sm text-white">
          {userName}'s screen
        </span>
      </div>

      {onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 size={18} className="text-white" />
          ) : (
            <Maximize2 size={18} className="text-white" />
          )}
        </button>
      )}
    </div>
  )
}
