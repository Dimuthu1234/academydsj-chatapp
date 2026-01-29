import { ipcRenderer } from 'electron'

// Expose electron API on window when nodeIntegration is true
const electronAPI = {
  getSources: () => ipcRenderer.invoke('get-sources'),
  saveRecording: (buffer: ArrayBuffer, filename: string) =>
    ipcRenderer.invoke('save-recording', buffer, filename),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
}

// Expose to window directly (nodeIntegration is enabled)
;(window as any).electronAPI = electronAPI
;(window as any).electron = true // Flag to detect Electron environment

export type ElectronAPI = {
  getSources: () => Promise<Array<{
    id: string
    name: string
    thumbnail: string
  }>>
  saveRecording: (buffer: ArrayBuffer, filename: string) => Promise<{
    success: boolean
    path?: string
  }>
  getAppVersion: () => Promise<string>
}
