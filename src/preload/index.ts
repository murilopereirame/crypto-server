import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface IIpcApi {
  pickOutput: () => void
  requestOutputPath: () => void
  requestEncryptFile: (password: string) => void
  requestDecryptFile: (password: string, checksumInput: string, checksumOutput: string) => void
  requestServerInfo: () => void
  stopServer: () => void
  startServer: () => void
}

// Custom APIs for renderer
const api: IIpcApi = {
  pickOutput: () => ipcRenderer.send('C-pick-output'),
  requestOutputPath: () => ipcRenderer.send('C-request-output'),
  requestEncryptFile: (password: string) => ipcRenderer.send('C-encrypt-file', [password]),
  requestDecryptFile: (password: string, checksumInput: string, checksumOutput: string) =>
    ipcRenderer.send('C-decrypt-file', [password, checksumInput, checksumOutput]),
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
