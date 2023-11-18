<script lang="ts">
export enum StatusType {
  STOPPED,
  ENCRYPT,
  DECRYPT
}
</script>
<script setup lang="ts">
import { useFileStore } from '../stores/files'
import { electronApi } from '../main'
import { Modal } from '../utils/Modal'
import { OperationType, useProgressStore } from '../stores/progress'
import ProgressModal from './ProgressModal.vue'
import { getCurrentInstance } from 'vue'

const fileStore = useFileStore()
const progressStore = useProgressStore()
const instance = getCurrentInstance()

let status = StatusType.STOPPED

const showPasswordMissingModal = () => {
  const modal = Modal()
  return modal.show(
    'Password is missing',
    [
      {
        text: 'OK',
        class: 'bg-gray-300 text-black',
        onClick: () => modal.dispose()
      }
    ],
    'You have to set a password before encrypting a file',
    'dialog',
    () => modal.dispose()
  )
}

const encryptFile = () => {
  if (!fileStore.password) return showPasswordMissingModal()

  progressStore.resetProgress()
  status = StatusType.ENCRYPT
  instance?.proxy?.$forceUpdate()
  return electronApi.requestEncryptFile(fileStore.password)
}

const decryptFile = () => {
  if (!fileStore.password) return showPasswordMissingModal()

  const splittedChecksums = [undefined, undefined]

  progressStore.resetProgress()
  status = StatusType.DECRYPT
  instance?.proxy?.$forceUpdate()

  return electronApi.requestDecryptFile(
    fileStore?.password ?? '',
    splittedChecksums[0],
    splittedChecksums[1]
  )
}

const getProgressOperation = (operation: OperationType) => {
  switch (operation) {
    case OperationType.STOPPED:
      return 'Stopped'
    case OperationType.INITIALIZING:
      return 'Initializing'
    case OperationType.GETTING_INFO:
      return 'Getting file info'
    case OperationType.GENERATING_INPUT_CHECKSUM:
      return 'Generating input file checksum'
    case OperationType.ENCRYPTING:
      return 'Encrypting file'
    case OperationType.DECRYPTING:
      return 'Decrypting file'
    case OperationType.GENERATING_OUTPUT_CHECKSUM:
      return 'Generating output file checksum'
    case OperationType.DONE:
      return 'Done'
    case OperationType.VERIFYING_CHECKSUM:
      return 'Verifying files checksum'
    default:
      return ''
  }
}

const getStatusTitle = (op: StatusType) => {
  if (op === StatusType.ENCRYPT) return 'Encrypting file'
  else if (op === StatusType.DECRYPT) return 'Decrypting file'
  return 'Waiting'
}

const getStatusText = (op: StatusType) => {
  if (op === StatusType.ENCRYPT)
    return "We're encrypting your file, please wait...\nThe encrypted file will be located at the output folder"
  else if (op === StatusType.DECRYPT)
    return "We're decrypting your file, please wait...\nThe file will be decrypted at the chosen output path"

  return ''
}
</script>

<template>
  <ProgressModal
    v-if="status !== StatusType.STOPPED && progressStore.operation !== OperationType.DONE"
    :title="getStatusTitle(status)"
  >
    <p class="whitespace-pre-wrap w-full text-center">{{ getStatusText(status) }}</p>
    <p class="w-full text-center mt-2 font-bold whitespace-pre-wrap">
      {{ `${getProgressOperation(progressStore.operation)}\n` }}
      {{ progressStore.readBytes }} of {{ progressStore.totalBytes }} {{ '\n' }} bytes processed
    </p>
  </ProgressModal>
  <section id="file-list" class="mt-10 flex flex-col flex-grow h-full bg-gray-700 rounded-t-3xl">
    <div class="flex flex-col w-full py-3 px-5 rounded-t-3xl">
      <div class="flex w-full justify-between">
        <h3 class="text-xl font-bold">Safe files list</h3>
        <div>
          <button :onclick="encryptFile" class="ml-2 px-4 bg-yellow-600 rounded-2xl text-white">
            Encrypt File
          </button>
          <button :onclick="decryptFile" class="ml-2 px-4 bg-yellow-600 rounded-2xl text-white">
            Decrypt File
          </button>
        </div>
      </div>
      <h5 class="text-xs mt-1">Hint: Click to copy the file path</h5>
    </div>
    <ul class="mt-2 px-5">
      <li v-for="file in fileStore.files" :key="file.outputPath" class="mb-1">
        <p class="flex flex-col">
          {{ file.outputPath }} - {{ file.outputChecksum }}
          <span class="text-xs">{{ file.inputName }} - {{ file.inputCheckSum }}</span>
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="less"></style>
