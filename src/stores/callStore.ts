import { create } from 'zustand'
import type { Call, CallParticipant, CallState } from '@/types'

interface CallStore extends CallState {
  setCurrentCall: (call: Call | null) => void
  setIncomingCall: (call: Call | null) => void
  setLocalStream: (stream: MediaStream | null) => void
  addParticipant: (participant: CallParticipant) => void
  removeParticipant: (participantId: string) => void
  updateParticipant: (participantId: string, data: Partial<CallParticipant>) => void
  toggleMute: () => void
  toggleVideo: () => void
  toggleScreenShare: () => void
  setRecording: (isRecording: boolean) => void
  endCall: () => void
  resetCallState: () => void
}

const initialState: CallState = {
  currentCall: null,
  incomingCall: null,
  localStream: null,
  isRecording: false,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
}

export const useCallStore = create<CallStore>((set, get) => ({
  ...initialState,

  setCurrentCall: (call: Call | null) => {
    set({ currentCall: call })
  },

  setIncomingCall: (call: Call | null) => {
    set({ incomingCall: call })
  },

  setLocalStream: (stream: MediaStream | null) => {
    const currentStream = get().localStream
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop())
    }
    set({ localStream: stream })
  },

  addParticipant: (participant: CallParticipant) => {
    set((state) => {
      if (!state.currentCall) return state
      const exists = state.currentCall.participants.some(
        (p) => p.id === participant.id
      )
      if (exists) return state
      return {
        currentCall: {
          ...state.currentCall,
          participants: [...state.currentCall.participants, participant],
        },
      }
    })
  },

  removeParticipant: (participantId: string) => {
    set((state) => {
      if (!state.currentCall) return state
      return {
        currentCall: {
          ...state.currentCall,
          participants: state.currentCall.participants.filter(
            (p) => p.id !== participantId
          ),
        },
      }
    })
  },

  updateParticipant: (participantId: string, data: Partial<CallParticipant>) => {
    set((state) => {
      if (!state.currentCall) return state
      return {
        currentCall: {
          ...state.currentCall,
          participants: state.currentCall.participants.map((p) =>
            p.id === participantId ? { ...p, ...data } : p
          ),
        },
      }
    })
  },

  toggleMute: () => {
    const { localStream, isMuted } = get()
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted
      })
    }
    set({ isMuted: !isMuted })
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get()
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff
      })
    }
    set({ isVideoOff: !isVideoOff })
  },

  toggleScreenShare: () => {
    set((state) => ({ isScreenSharing: !state.isScreenSharing }))
  },

  setRecording: (isRecording: boolean) => {
    set({ isRecording })
  },

  endCall: () => {
    const { localStream } = get()
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    set({
      currentCall: null,
      localStream: null,
      isRecording: false,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
    })
  },

  resetCallState: () => {
    const { localStream } = get()
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    set(initialState)
  },
}))
