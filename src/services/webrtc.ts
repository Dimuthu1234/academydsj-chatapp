import Peer, { Instance as PeerInstance } from 'simple-peer'
import { socketService } from './socket'

interface PeerConnection {
  peerId: string
  peer: PeerInstance
  stream?: MediaStream
}

class WebRTCService {
  private peers: Map<string, PeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private screenStream: MediaStream | null = null
  private onStreamCallback?: (peerId: string, stream: MediaStream) => void
  private onDisconnectCallback?: (peerId: string) => void

  async getLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
        } : false,
      })
      return this.localStream
    } catch (error) {
      console.error('Failed to get local stream:', error)
      throw error
    }
  }

  async getScreenStream(): Promise<MediaStream> {
    try {
      if (window.electronAPI) {
        const sources = await window.electronAPI.getSources()
        if (sources.length === 0) throw new Error('No screen sources available')

        this.screenStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sources[0].id,
            },
          } as MediaTrackConstraints,
        })
      } else {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: true,
        })
      }
      return this.screenStream
    } catch (error) {
      console.error('Failed to get screen stream:', error)
      throw error
    }
  }

  createPeer(
    targetId: string,
    initiator: boolean,
    stream?: MediaStream
  ): PeerInstance {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    })

    peer.on('signal', (signal) => {
      socketService.sendSignal(targetId, signal)
    })

    peer.on('stream', (remoteStream) => {
      this.onStreamCallback?.(targetId, remoteStream)
    })

    peer.on('close', () => {
      this.removePeer(targetId)
      this.onDisconnectCallback?.(targetId)
    })

    peer.on('error', (error) => {
      console.error(`Peer error with ${targetId}:`, error)
      this.removePeer(targetId)
    })

    this.peers.set(targetId, { peerId: targetId, peer })
    return peer
  }

  signalPeer(peerId: string, signal: Peer.SignalData) {
    const connection = this.peers.get(peerId)
    if (connection) {
      connection.peer.signal(signal)
    }
  }

  removePeer(peerId: string) {
    const connection = this.peers.get(peerId)
    if (connection) {
      connection.peer.destroy()
      this.peers.delete(peerId)
    }
  }

  getLocalStreamTrack(): MediaStream | null {
    return this.localStream
  }

  getScreenStreamTrack(): MediaStream | null {
    return this.screenStream
  }

  replaceTrack(newStream: MediaStream) {
    this.peers.forEach(({ peer }) => {
      const videoTrack = newStream.getVideoTracks()[0]
      if (videoTrack) {
        const sender = (peer as unknown as { _pc: RTCPeerConnection })._pc
          .getSenders()
          .find((s: RTCRtpSender) => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      }
    })
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled
      })
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled
      })
    }
  }

  onStream(callback: (peerId: string, stream: MediaStream) => void) {
    this.onStreamCallback = callback
  }

  onDisconnect(callback: (peerId: string) => void) {
    this.onDisconnectCallback = callback
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }
  }

  stopScreenStream() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop())
      this.screenStream = null
    }
  }

  cleanup() {
    this.peers.forEach(({ peer }) => peer.destroy())
    this.peers.clear()
    this.stopLocalStream()
    this.stopScreenStream()
  }
}

export const webrtcService = new WebRTCService()
