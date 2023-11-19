import express from 'express'
import https from 'https'
import { Server } from 'http'
import { AddressInfo } from 'net'
import { BrowserWindow, ipcMain } from 'electron'
import { FileHandler } from './file'
import serveIndex from 'serve-index'
import crypto from 'crypto'
import forge from 'node-forge'

export enum EServerStatus {
  RUNNING = 'Running',
  STOPPED = 'Stopped',
  UNKNOWN = 'Unknown'
}

export class WebServer {
  private static instance: WebServer | null
  private publicKey = ''
  private privateKey = ''
  private cert = ''
  server: Server | null = null
  expressApp = express()

  static getInstance = () => {
    if (!WebServer.instance) WebServer.instance = new WebServer()

    return WebServer.instance
  }

  private configureServer = () => {
    this.generateCertificate()
    this.buildRoutes()
    this.configureListeners()
    this.updateServerDir()
  }

  private generateCertificate = () => {
    forge.options.usePureJavaScript = true

    const pki = forge.pki
    const keys = pki.rsa.generateKeyPair()
    const cert = pki.createCertificate()

    cert.publicKey = keys.publicKey
    cert.serialNumber = `${Math.abs(parseInt(crypto.randomBytes(20).toString('hex')), 16)}`
    cert.validity.notBefore = new Date()
    cert.validity.notAfter = new Date(2030, 0, 1)

    const attrs = [
      { name: 'commonName', value: 'localhost' },
      { name: 'countryName', value: '' },
      { shortName: 'ST', value: '' },
      { name: 'localityName', value: '' },
      { name: 'organizationName', value: '' },
      { shortName: 'OU', value: '' }
    ]
    cert.setSubject(attrs)
    cert.setIssuer(attrs)
    cert.sign(keys.privateKey)

    this.privateKey = pki.privateKeyToPem(keys.privateKey)
    this.cert = pki.certificateToPem(cert)
  }

  startServer = () => {
    this.configureServer()
    this.server = https
      .createServer(
        {
          key: this.privateKey,
          cert: this.cert
        },
        this.expressApp
      )
      .listen(0, () => {
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
