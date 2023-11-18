import * as argon2 from 'argon2'
import crypto, { CipherGCMTypes } from 'crypto'
import { argon2id } from 'argon2'
import * as fs from 'fs'

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

export interface CryptoProgress {
  totalBytes: number
  readBytes: number
  operation: OperationType
}

export class CryptoUtil {
  private generateArgon2Hash = async (salt: Buffer, key: string) => {
    return await argon2.hash(key, {
      hashLength: 32,
      timeCost: 2,
      parallelism: 4,
      salt: salt,
      type: argon2id,
      saltLength: 32,
      raw: true
    })
  }
  public encryptFile = async (
    inputFile: string,
    outputFile: string,
    key: string,
    fileBytes: number,
    callback?: (value?: unknown) => void,
    dataCallback?: (progress: CryptoProgress) => void
  ) => {
    if (dataCallback)
      dataCallback({
        totalBytes: fileBytes,
        readBytes: 0,
        operation: OperationType.ENCRYPTING
      })

    const passwordSalt = crypto.randomBytes(32)
    const passwordHash = await this.generateArgon2Hash(passwordSalt, key)

    const IV = crypto.randomBytes(16)

    const algorithm: CipherGCMTypes = 'aes-256-gcm'
    const cipher = crypto.createCipheriv(algorithm, passwordHash, IV)

    const inputStream = fs.createReadStream(inputFile)
    const outputStream = fs.createWriteStream(outputFile)
    let readBytes = 0

    inputStream
      .on('data', (data) => {
        readBytes += data.length
        if (dataCallback) {
          dataCallback({
            totalBytes: fileBytes,
            readBytes,
            operation: OperationType.ENCRYPTING
          })
        }
      })
      .pipe(cipher)
      .pipe(outputStream)
      .on('finish', () => {
        const authTag = cipher.getAuthTag()
        fs.appendFileSync(outputFile, Buffer.concat([IV, passwordSalt, authTag]))

        if (dataCallback)
          dataCallback({
            totalBytes: fileBytes,
            readBytes,
            operation: OperationType.GENERATING_OUTPUT_CHECKSUM
          })
        if (callback) callback()
      })
  }

  public decryptFile = async (
    inputFile: string,
    outputFile: string,
    key: string,
    fileBytes: number,
    callback?: (value?: unknown) => void,
    dataCallback?: (progress: CryptoProgress) => void
  ) => {
    if (dataCallback)
      dataCallback({
        totalBytes: fileBytes,
        readBytes: 0,
        operation: OperationType.DECRYPTING
      })

    const IV = Buffer.alloc(16)
    const authTag: Buffer = Buffer.alloc(16)
    const passwordSalt = Buffer.alloc(32)
    const fd = fs.openSync(inputFile, 'r')

    fs.readSync(fd, IV, 0, 16, fileBytes - 64)
    fs.readSync(fd, passwordSalt, 0, 32, fileBytes - 48)
    fs.readSync(fd, authTag, 0, 16, fileBytes - 16)
    fs.close(fd)

    const passwordHash = await this.generateArgon2Hash(passwordSalt, key)
    const algorithm: CipherGCMTypes = 'aes-256-gcm'
    const cipher = crypto.createDecipheriv(algorithm, passwordHash, IV).setAuthTag(authTag)

    const inputStream = fs.createReadStream(inputFile, {
      start: 0,
      end: fileBytes - 65
    })

    const outputStream = fs.createWriteStream(outputFile)
    let readBytes = 0
    inputStream
      .on('data', (data) => {
        readBytes += data.length
        if (dataCallback) {
          dataCallback({
            totalBytes: fileBytes,
            readBytes,
            operation: OperationType.DECRYPTING
          })
        }
      })
      .pipe(cipher)
      .pipe(outputStream)
      .on('finish', () => {
        if (callback) callback()
      })
  }

  public generateCheckSum = async (inputPath: string) => {
    const algo = 'sha256'
    const checkSum = crypto.createHash(algo)

    const stream = fs.createReadStream(inputPath)
    stream.on('data', function (d) {
      checkSum.update(d)
    })

    return await new Promise((resolve) => stream.on('end', () => resolve(checkSum.digest('hex'))))
  }
}
