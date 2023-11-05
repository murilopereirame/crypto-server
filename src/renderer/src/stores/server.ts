import { defineStore } from 'pinia'

export enum EServerStatus {
  RUNNING = 'Running',
  STOPPED = 'Stopped',
  UNKNOWN = 'Unknown'
}

export interface IServerInfo {
  port: number
  status: EServerStatus
}

export const useServerStore = defineStore('server', {
  state: (): IServerInfo => {
    return {
      port: -1,
      status: EServerStatus.UNKNOWN
    }
  },
  actions: {
    updateServerInfo(info: IServerInfo) {
      this.port = info.port
      this.status = info.status
    }
  }
})
