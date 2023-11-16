import express from 'express'
import { Server } from 'http'
import { AddressInfo } from 'net'
import { BrowserWindow, ipcMain } from 'electron'
import { FileHandler } from './file'
import serveIndex from 'serve-index'

export enum EServerStatus {
  RUNNING = 'Running',
  STOPPED = 'Stopped',
  UNKNOWN = 'Unknown'
}

export class WebServer {
  private static instance: WebServer | null
  server: Server | null = null
  expressApp = express()

  static getInstance = () => {
    if (!WebServer.instance) WebServer.instance = new WebServer()

    return WebServer.instance
  }

  private configureServer = () => {
    this.buildRoutes()
    this.configureListeners()
    this.updateServerDir()
  }

  startServer = () => {
    this.configureServer()
    this.server = this.expressApp.listen(0, () => {
      console.log(`Server running on ${(this.server?.address() as AddressInfo)?.port}`)
    })
  }

  private buildRoutes = () => {
    this.expressApp.get('/', function (_, res) {
      res.send('Server is ready!')
    })
  }

  private configureListeners = () => {
    ipcMain.on('C-server-info', () => {
      BrowserWindow.getAllWindows().map((browserWindow) => {
        browserWindow.webContents.send('S-server-info', {
          port: (this.server?.address() as AddressInfo)?.port,
          status: this.server?.listening ? EServerStatus.RUNNING : EServerStatus.STOPPED
        })
      })
    })

    ipcMain.on('C-server-stop', () => {
      this.stopServer()
      BrowserWindow.getAllWindows().map((browserWindow) => {
        browserWindow.webContents.send('S-server-info', {
          port: (this.server?.address() as AddressInfo)?.port,
          status: this.server?.listening ? EServerStatus.RUNNING : EServerStatus.STOPPED
        })
      })
    })

    ipcMain.on('C-server-start', () => {
      this.startServer()
      BrowserWindow.getAllWindows().map((browserWindow) => {
        browserWindow.webContents.send('S-server-info', {
          port: (this.server?.address() as AddressInfo)?.port,
          status: this.server?.listening ? EServerStatus.RUNNING : EServerStatus.STOPPED
        })
      })
    })
  }
  stopServer = () => {
    if (this.server?.listening) {
      this.server.close()
    }
  }

  updateServerDir = () => {
    this.expressApp.use(
      '/files',
      express.static(FileHandler.getInstance().getOutputDir()),
      serveIndex(FileHandler.getInstance().getOutputDir(), { icons: true })
    )
  }
}
