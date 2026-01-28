import { useCallback, useEffect, useRef } from 'react'
import { useCallStore } from '@/stores/callStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { socketService } from '@/services/socket'
import { webrtcService } from '@/services/webrtc'
import { recorderService } from '@/services/recorder'
import type { Call, User } from '@/types'

export function useCall() {
  const {
    currentCall,
    incomingCall,
    localStream,
    isRecording,
    isMuted,
    isVideoOff,
    isScreenSharing,
    setCurrentCall,
    setIncomingCall,
    setLocalStream,
    removeParticipant,
    updateParticipant,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    setRecording,
    endCall,
  } = useCallStore()

  const { user } = useAuthStore()
  const { addNotification, settings } = useNotificationStore()
  const screenStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const unsubIncoming = socketService.onIncomingCall((call: Call) => {
      setIncomingCall(call)

      // Show notification for incoming call
      if (settings.callNotifications) {
        addNotification({
          type: 'call',
          title: `Incoming ${call.type} call`,
          body: `${call.caller?.displayName || 'Someone'} is calling you`,
          data: {
            callId: call.id,
            senderId: call.callerId,
          },
        })
      }
    })

    const unsubAccepted = socketService.onCallAccepted((callId: string) => {
      if (currentCall?.id === callId) {
        setCurrentCall({ ...currentCall, status: 'ongoing' })
      }
    })

    const unsubRejected = socketService.onCallRejected((callId: string) => {
      if (currentCall?.id === callId || incomingCall?.id === callId) {
        handleEndCall()
      }
    })

    const unsubEnded = socketService.onCallEnded((callId: string) => {
      if (currentCall?.id === callId) {
        handleEndCall()
      }
    })

    const unsubSignal = socketService.onSignal(({ senderId, signal }) => {
      webrtcService.signalPeer(senderId, signal as Parameters<typeof webrtcService.signalPeer>[1])
    })

    // Listen for meeting started notifications
    const unsubMeeting = socketService.onMeetingStarted((data) => {
      if (settings.callNotifications) {
        addNotification({
          type: 'meeting',
          title: `${data.type === 'video' ? 'Video' : 'Audio'} Meeting Started`,
          body: `${data.hostName} started a meeting${data.groupName ? ` in ${data.groupName}` : ''}`,
          data: {
            callId: data.callId,
            groupId: data.groupId,
          },
        })
      }
    })

    return () => {
      unsubIncoming()
      unsubAccepted()
      unsubRejected()
      unsubEnded()
      unsubSignal()
      unsubMeeting()
    }
  }, [currentCall, incomingCall, setCurrentCall, setIncomingCall, settings.callNotifications, addNotification])

  useEffect(() => {
    webrtcService.onStream((peerId, stream) => {
      updateParticipant(peerId, { stream })
    })

    webrtcService.onDisconnect((peerId) => {
      removeParticipant(peerId)
    })
  }, [updateParticipant, removeParticipant])

  const initiateCall = useCallback(
    async (targetUser: User, type: 'audio' | 'video') => {
      if (!user) return

      let stream: MediaStream | null = null
      try {
        stream = await webrtcService.getLocalStream(
          type === 'video',
          true
        )
        setLocalStream(stream)
      } catch (error) {
        console.error('Failed to get media stream:', error)
        alert('Could not access camera/microphone. Please check permissions.')
        return
      }

      const call: Call = {
        id: crypto.randomUUID(),
        type,
        status: 'ringing',
        callerId: user.id,
        caller: user,
        participants: [
          {
            id: user.id,
            peerId: user.id,
            user,
            stream: stream || undefined,
            isMuted: false,
            isVideoOff: type === 'audio',
            isScreenSharing: false,
          },
          {
            id: targetUser.id,
            peerId: targetUser.id,
            user: targetUser,
            isMuted: false,
            isVideoOff: type === 'audio',
            isScreenSharing: false,
          },
        ],
      }

      setCurrentCall(call)
      socketService.initiateCall(call)

      if (stream) {
        webrtcService.createPeer(targetUser.id, true, stream)
      }
    },
    [user, setCurrentCall, setLocalStream]
  )

  // Start a meeting (can be used for group calls or solo meetings)
  const startMeeting = useCallback(
    async (type: 'audio' | 'video', groupId?: string, groupName?: string) => {
      if (!user) return

      let stream: MediaStream | null = null
      try {
        stream = await webrtcService.getLocalStream(
          type === 'video',
          true
        )
        setLocalStream(stream)
      } catch (error) {
        console.error('Failed to get media stream:', error)
        alert('Could not access camera/microphone. Please check permissions.')
        return
      }

      const call: Call = {
        id: groupId || crypto.randomUUID(),
        type,
        status: 'ongoing',
        callerId: user.id,
        caller: user,
        participants: [
          {
            id: user.id,
            peerId: user.id,
            user,
            stream: stream || undefined,
            isMuted: false,
            isVideoOff: type === 'audio',
            isScreenSharing: false,
          },
        ],
      }

      setCurrentCall(call)

      // Emit meeting started event so others can join
      socketService.getSocket()?.emit('meeting:start', {
        callId: call.id,
        type,
        groupId,
        groupName,
        hostId: user.id,
        hostName: user.displayName,
      })

      // Show notification to group members
      if (settings.callNotifications && groupName) {
        addNotification({
          type: 'meeting',
          title: 'Meeting Started',
          body: `You started a ${type} meeting in ${groupName}`,
          data: {
            callId: call.id,
            groupId,
          },
        })
      }
    },
    [user, setCurrentCall, setLocalStream, settings.callNotifications, addNotification]
  )

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !user) return

    const stream = await webrtcService.getLocalStream(
      incomingCall.type === 'video',
      true
    )
    setLocalStream(stream)

    const call: Call = {
      ...incomingCall,
      status: 'ongoing',
      participants: [
        ...incomingCall.participants,
        {
          id: user.id,
          peerId: user.id,
          user,
          stream,
          isMuted: false,
          isVideoOff: incomingCall.type === 'audio',
          isScreenSharing: false,
        },
      ],
    }

    setCurrentCall(call)
    setIncomingCall(null)
    socketService.acceptCall(call.id)

    webrtcService.createPeer(incomingCall.callerId, false, stream)
  }, [incomingCall, user, setCurrentCall, setIncomingCall, setLocalStream])

  const rejectCall = useCallback(() => {
    if (!incomingCall) return
    socketService.rejectCall(incomingCall.id)
    setIncomingCall(null)
  }, [incomingCall, setIncomingCall])

  const handleEndCall = useCallback(() => {
    if (currentCall) {
      socketService.endCall(currentCall.id)
    }
    if (isRecording) {
      stopRecording()
    }
    webrtcService.cleanup()
    endCall()
  }, [currentCall, isRecording, endCall])

  const handleToggleMute = useCallback(() => {
    webrtcService.toggleAudio(!isMuted)
    toggleMute()
  }, [isMuted, toggleMute])

  const handleToggleVideo = useCallback(() => {
    webrtcService.toggleVideo(!isVideoOff)
    toggleVideo()
  }, [isVideoOff, toggleVideo])

  const handleToggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      webrtcService.stopScreenStream()
      if (localStream) {
        webrtcService.replaceTrack(localStream)
      }
      screenStreamRef.current = null
    } else {
      const screenStream = await webrtcService.getScreenStream()
      screenStreamRef.current = screenStream
      webrtcService.replaceTrack(screenStream)

      screenStream.getVideoTracks()[0].onended = () => {
        if (localStream) {
          webrtcService.replaceTrack(localStream)
        }
        toggleScreenShare()
      }
    }
    toggleScreenShare()
  }, [isScreenSharing, localStream, toggleScreenShare])

  const startRecording = useCallback(async () => {
    const streams: MediaStream[] = []
    if (localStream) streams.push(localStream)
    if (screenStreamRef.current) streams.push(screenStreamRef.current)

    currentCall?.participants.forEach((p) => {
      if (p.stream && p.id !== user?.id) {
        streams.push(p.stream)
      }
    })

    await recorderService.startRecording(streams)
    setRecording(true)
  }, [localStream, currentCall, user?.id, setRecording])

  const stopRecording = useCallback(async () => {
    const blob = await recorderService.stopRecording()
    if (blob) {
      await recorderService.saveRecording(blob)
    }
    setRecording(false)
  }, [setRecording])

  return {
    currentCall,
    incomingCall,
    localStream,
    isRecording,
    isMuted,
    isVideoOff,
    isScreenSharing,
    initiateCall,
    startMeeting,
    acceptCall,
    rejectCall,
    endCall: handleEndCall,
    toggleMute: handleToggleMute,
    toggleVideo: handleToggleVideo,
    toggleScreenShare: handleToggleScreenShare,
    startRecording,
    stopRecording,
  }
}
