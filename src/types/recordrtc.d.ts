declare module 'recordrtc' {
  interface RecordRTCOptions {
    type?: 'video' | 'audio' | 'gif' | 'canvas'
    mimeType?: string
    bitsPerSecond?: number
    videoBitsPerSecond?: number
    audioBitsPerSecond?: number
    recorderType?: unknown
    canvas?: HTMLCanvasElement
    video?: HTMLVideoElement
    previewStream?: MediaStream
  }

  class RecordRTCPromisesHandler {
    constructor(stream: MediaStream, options?: RecordRTCOptions)
    startRecording(): Promise<void>
    stopRecording(): Promise<void>
    pauseRecording(): Promise<void>
    resumeRecording(): Promise<void>
    getBlob(): Promise<Blob>
    getDataURL(): Promise<string>
    toURL(): string
    destroy(): Promise<void>
  }

  export default RecordRTCPromisesHandler
  export { RecordRTCPromisesHandler }
}
