import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { useServerStore } from './stores/server'
import { useFileStore } from "./stores/files";

export const ipcRenderer = window.electron.ipcRenderer

export interface IIpcApi {
  pickOutput: () => void
  requestOutputPath: () => void
  requestEncryptFile: (password: string) => void
  requestDecryptFile: (password: string, checksumInput?: string, checksumOutput?: string) => void
  requestServerInfo: () => void
  stopServer: () => void
  startServer: () => void
}

export const electronApi: IIpcApi = window.api as IIpcApi

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

ipcRenderer.on('S-output-change', (_event, value) => {
  const fileStore = useFileStore()
  fileStore.setOutputPath(value)
})

ipcRenderer.on('S-encrypt-result', (_event, value) => {
  const fileStore = useFileStore()
  fileStore.addFile(value)
})

ipcRenderer.on('S-server-info', (_event, value) => {
  const serverStore = useServerStore()
  serverStore.updateServerInfo(value)
})

app.mount('#app')
