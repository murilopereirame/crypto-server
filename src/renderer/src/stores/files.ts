import { defineStore } from 'pinia'

export interface IFile {
  outputPath: string
  inputCheckSum: string
  inputName: string
  outputChecksum: string
}

export interface IWebFiles {
  files: IFile[]
  outputPath: string
  password?: string
}

export const useFileStore = defineStore('files', {
  state: (): IWebFiles => {
    return {
      files: [],
      outputPath: '',
      password: undefined
    }
  },
  actions: {
    addFile(file: IFile) {
      this.files = [...this.files, file]
    },
    setOutputPath(path: string) {
      this.outputPath = path
    },
    setPassword(password: string) {
      this.password = password
    }
  }
})
