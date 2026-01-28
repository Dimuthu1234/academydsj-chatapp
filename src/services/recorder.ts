import { RecordRTCPromisesHandler } from 'recordrtc'

class RecorderService {
  private recorder: RecordRTCPromisesHandler | null = null
  private isRecording = false

  async startRecording(streams: MediaStream[]): Promise<void> {
    if (this.isRecording) {
      console.warn('Recording already in progress')
      return
    }

    const combinedStream = new MediaStream()
    streams.forEach((stream) => {
      stream.getTracks().forEach((track) => {
        combinedStream.addTrack(track)
      })
    })

    this.recorder = new RecordRTCPromisesHandler(combinedStream, {
      type: 'video',
      mimeType: 'video/webm;codecs=vp9',
      bitsPerSecond: 2500000,
      videoBitsPerSecond: 2000000,
      audioBitsPerSecond: 128000,
    })

    await this.recorder.startRecording()
    this.isRecording = true
  }

  async pauseRecording(): Promise<void> {
    if (this.recorder && this.isRecording) {
      await this.recorder.pauseRecording()
    }
  }

  async resumeRecording(): Promise<void> {
    if (this.recorder && this.isRecording) {
      await this.recorder.resumeRecording()
    }
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.recorder || !this.isRecording) {
      console.warn('No recording in progress')
      return null
    }

    await this.recorder.stopRecording()
    const blob = await this.recorder.getBlob()
    this.isRecording = false

    await this.recorder.destroy()
    this.recorder = null

    return blob
  }

  async saveRecording(blob: Blob, filename?: string): Promise<void> {
    const defaultFilename = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`
    const finalFilename = filename || defaultFilename

    if (window.electronAPI) {
      const arrayBuffer = await blob.arrayBuffer()
      const result = await window.electronAPI.saveRecording(arrayBuffer, finalFilename)
      if (result.success) {
        console.log('Recording saved to:', result.path)
      }
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = finalFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  getRecordingState(): boolean {
    return this.isRecording
  }
}

export const recorderService = new RecorderService()
