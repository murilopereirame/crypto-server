import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { useServerStore } from './stores/server'

export interface IIpcApi {
  onUpdateServerInfo: (callback: (_event: never, value: never) => void) => void
  requestServerInfo: () => void
  stopServer: () => void
  startServer: () => void
}

export const electronApi: IIpcApi = window.api as IIpcApi

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

electronApi.onUpdateServerInfo((_event, value) => {
  const serverStore = useServerStore()
  serverStore.updateServerInfo(value)
})

app.mount('#app')
