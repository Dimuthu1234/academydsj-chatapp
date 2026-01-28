import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  saveRecording: (buffer: ArrayBuffer, filename: string) =>
    ipcRenderer.invoke('save-recording', buffer, filename),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
})

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
