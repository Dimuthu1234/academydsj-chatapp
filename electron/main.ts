import { app, BrowserWindow, ipcMain, desktopCapturer, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../build-resources/icon.png'),
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // Load index.html from dist folder
    // Works for both development and production (asar)
    // __dirname is dist-electron/, so ../dist/index.html is correct
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers for screen capture
ipcMain.handle('get-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 300, height: 200 },
  })
  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
  }))
})

// IPC Handler for saving recordings
ipcMain.handle('save-recording', async (_, buffer: ArrayBuffer, filename: string) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: filename,
    filters: [
      { name: 'Video Files', extensions: ['webm', 'mp4'] },
    ],
  })

  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(buffer))
    return { success: true, path: filePath }
  }
  return { success: false }
})

// IPC Handler for app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})
