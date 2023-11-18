import * as os from 'os'
import crypto from 'crypto'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import { CryptoProgress, CryptoUtil, OperationType } from './crypto'
import * as path from 'path'
import { AssertionError } from 'assert'
import * as fs from 'fs'
import { WebServer } from './server'

export class FileHandler {
  private static instance: FileHandler | null
  private outputFolder = ''
  private tempDir = `${os.homedir()}/${crypto.randomBytes(16).toString('hex')}`

  constructor() {
    this.outputFolder = this.tempDir
  }

  static getInstance = () => {
    if (!this.instance) this.instance = new FileHandler()

    if (!fs.existsSync(this.instance.tempDir)) fs.mkdirSync(this.instance.tempDir)

    return this.instance
  }

  public getOutputDir = () => this.outputFolder

  private publishFileProgress = (progress: CryptoProgress) => {
    BrowserWindow.getAllWindows().map((browserWindow) => {
      browserWindow.webContents.send('S-file-progress', progress)
    })
  }

  public configureListeners = () => {
    ipcMain.on('C-encrypt-file', (_, arg) => {
      this.processFileEncryption(arg[0], this.publishFileProgress).then((result) => {
        BrowserWindow.getAllWindows().map((browserWindow) => {
          browserWindow.webContents.send('S-encrypt-result', result)
        })
      })
    })

    ipcMain.on('C-decrypt-file', (_, arg) => {
      this.processFileDecrypt(arg[0], arg[1], arg[2], this.publishFileProgress).then((result) => {
        BrowserWindow.getAllWindows().map((browserWindow) => {
          browserWindow.webContents.send('S-decrypt-result', result)
        })
      })
    })

    ipcMain.on('C-pick-output', () => {
      this.pickOutputDir().then((result) => {
        BrowserWindow.getAllWindows().map((browserWindow) => {
          if (result) browserWindow.webContents.send('S-output-change', result)
        })
      })
    })

    ipcMain.on('C-request-output', () => {
      BrowserWindow.getAllWindows().map((browserWindow) => {
        browserWindow.webContents.send('S-output-change', this.outputFolder)
      })
    })
  }

  public sendOutputInfo = () => {
    BrowserWindow.getAllWindows().map((browserWindow) => {
      browserWindow.webContents.send('S-output-change', this.outputFolder)
    })
  }

  public pickOutputDir = async () => {
    const dialogResult = await dialog.showOpenDialog({
      title: 'Select Output Path',
      properties: ['openDirectory', 'showHiddenFiles', 'dontAddToRecent'],
      defaultPath: this.outputFolder
    })

    if (!dialogResult.canceled) {
      await this.removeTempDir()
      this.outputFolder = dialogResult.filePaths[0]
      WebServer.getInstance().stopServer()
      WebServer.getInstance().startServer()
    }

    return this.outputFolder
  }

  private processFileEncryption = async (
    key: string,
    progressCallback?: (progress: CryptoProgress) => void
  ) => {
    const progressFn = progressCallback ? progressCallback : (_data: CryptoProgress) => null

    progressFn({
      totalBytes: 0,
      readBytes: 0,
      operation: OperationType.INITIALIZING
    })

    const dialogResult = await dialog.showOpenDialog({
      title: 'Select File to be Encrypted',
      properties: ['openFile', 'showHiddenFiles', 'dontAddToRecent']
    })

    if (!dialogResult.canceled) {
      const filePath = dialogResult.filePaths[0]
      const cryptoUtil = new CryptoUtil()
      const outputFile = crypto.randomBytes(5).toString('hex')

      progressFn({
        totalBytes: 0,
        readBytes: 0,
        operation: OperationType.GENERATING_INPUT_CHECKSUM
      })
      const inputCheckSum = await cryptoUtil.generateCheckSum(filePath)

      progressFn({
        totalBytes: 0,
        readBytes: 0,
        operation: OperationType.GETTING_INFO
      })

      let bytes = 0
      await new Promise((resolve) =>
        fs.stat(filePath, (_err, stats) => {
          bytes = stats.size
          cryptoUtil.encryptFile(
            filePath,
            `${this.outputFolder}/${outputFile}`,
            key,
            stats.size,
            resolve,
            progressCallback
          )
        })
      )

      const outputChecksum = await cryptoUtil.generateCheckSum(`${this.outputFolder}/${outputFile}`)

      progressFn({
        readBytes: bytes,
        totalBytes: bytes,
        operation: OperationType.DONE
      })

      return {
        inputCheckSum,
        inputName: path.basename(filePath),
        outputPath: `${this.outputFolder}/${outputFile}`,
        outputChecksum
      }
    }

    progressFn({
      totalBytes: 0,
      readBytes: 0,
      operation: OperationType.DONE
    })

    return false
  }

  private processFileDecrypt = async (
    key: string,
    fileInputChecksum?: string,
    fileOutputChecksum?: string,
    progressCallback?: (progress: CryptoProgress) => void
  ) => {
    const progressFn = progressCallback ? progressCallback : (_data: CryptoProgress) => null

    progressFn({
      totalBytes: 0,
      readBytes: 0,
      operation: OperationType.INITIALIZING
    })

    const fileResult = await dialog.showOpenDialog({
      title: 'Select File to be Decrypted',
      properties: ['openFile', 'showHiddenFiles', 'dontAddToRecent']
    })

    const pathResult = await dialog.showOpenDialog({
      title: 'Select Output Path',
      properties: ['openDirectory', 'showHiddenFiles', 'dontAddToRecent'],
      defaultPath: this.outputFolder
    })

    if (fileResult.canceled || pathResult.canceled) {
      progressFn({
        totalBytes: 0,
        readBytes: 0,
        operation: OperationType.DONE
      })
      return false
    }

    const filePath = fileResult.filePaths[0]
    const outputPath = pathResult.filePaths[0]
    const cryptoUtil = new CryptoUtil()
    const outputFile = `${path.basename(filePath)}-decrypted`

    if (fileInputChecksum !== undefined) {
      progressFn({
        totalBytes: 0,
        readBytes: 0,
        operation: OperationType.GENERATING_INPUT_CHECKSUM
      })

      const inputCheckSum = await cryptoUtil.generateCheckSum(filePath)
      if (inputCheckSum !== fileInputChecksum)
        throw new AssertionError({
          message: 'Invalid Input File Checksum',
          actual: inputCheckSum,
          expected: fileInputChecksum
        })
    }

    let bytes = 0
    await new Promise((resolve) =>
      fs.stat(filePath, (_err, stats) => {
        bytes = stats.size
        cryptoUtil.decryptFile(
          filePath,
          `${outputPath}/${outputFile}`,
          key,
          stats.size,
          resolve,
          progressCallback
        )
      })
    )

    progressFn({
      totalBytes: bytes,
      readBytes: bytes,
      operation: OperationType.GENERATING_OUTPUT_CHECKSUM
    })

    const outputChecksum = await cryptoUtil.generateCheckSum(`${outputPath}/${outputFile}`)

    if (fileOutputChecksum !== undefined) {
      progressFn({
        totalBytes: bytes,
        readBytes: bytes,
        operation: OperationType.VERIFYING_CHECKSUM
      })

      if (outputChecksum !== fileOutputChecksum)
        throw new AssertionError({
          message: 'Invalid Input File Checksum',
          actual: outputChecksum,
          expected: fileInputChecksum
        })
    }

    progressFn({
      totalBytes: bytes,
      readBytes: bytes,
      operation: OperationType.DONE
    })

    return {
      outputPath: `${outputPath}/${outputFile}`,
      outputChecksum
    }
  }

  public removeTempDir = async () => {
    return await new Promise((resolve, reject) =>
      fs.rm(this.tempDir, { recursive: true, force: true }, (err) => {
        if (err) reject(err)

        resolve(err)
      })
    )
  }
}
