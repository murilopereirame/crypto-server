# Crypto Server

Get ride of sharing your files in a unsecure way!

### Motivation

Sharing files across the internet could be not so easy when the subject is security.
Even with TLS, the risk of having files stolen/changed by some attack as Man-in-the-middle still real.

This application aims a easy way to encrypt/decrypt files using the most strong AES, with 256 bits of encryption
and using Argon2 to generate the password hashes with random salts.

## Project Setup

### Install

```bash
$ yarn
```

### Development

```bash
$ yarn dev
```

### Build

```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux
```
