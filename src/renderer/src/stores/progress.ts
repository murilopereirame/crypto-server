import { defineStore } from 'pinia'

export enum OperationType {
  STOPPED,
  INITIALIZING,
  GENERATING_INPUT_CHECKSUM,
  GETTING_INFO,
  ENCRYPTING,
  DECRYPTING,
  GENERATING_OUTPUT_CHECKSUM,
  VERIFYING_CHECKSUM,
  DONE
}

export interface IProgress {
  totalBytes: number
  readBytes: number
  operation: OperationType
}

export const useProgressStore = defineStore('progress', {
  state: (): IProgress => {
    return {
      totalBytes: 0,
      readBytes: 0,
      operation: OperationType.STOPPED
    }
  },
  actions: {
    resetProgress() {
      this.totalBytes = 0
      this.readBytes = 0
      this.operation = OperationType.STOPPED
    },
    updateProgress(progress: IProgress) {
      this.totalBytes = progress.totalBytes
      this.readBytes = progress.readBytes
      this.operation = progress.operation
    }
  }
})
