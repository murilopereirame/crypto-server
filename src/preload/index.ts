import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface IIpcApi {
  onUpdateServerInfo: (callback: never) => void
  requestServerInfo: () => void
  stopServer: () => void
  startServer: () => void
}

// Custom APIs for renderer
const api: IIpcApi = {
  onUpdateServerInfo: (callback: never) => ipcRenderer.on('S-server-info', callback),
  requestServerInfo: () => ipcRenderer.send('C-server-info'),
  stopServer: () => ipcRenderer.send('C-server-stop'),
  startServer: () => ipcRenderer.send('C-server-start')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
