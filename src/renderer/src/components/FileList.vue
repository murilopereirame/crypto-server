<script setup lang="ts">
import { useFileStore } from '../stores/files'
import { electronApi } from '../main'
import { Modal } from '../utils/Modal'

const fileStore = useFileStore()

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

  return electronApi.requestEncryptFile(fileStore.password)
}

let checkSums

const decryptFile = () => {
  if (!fileStore.password) return showPasswordMissingModal()

  const modal = Modal()
  modal.show(
    'Verify checksum',
    [
      {
        text: 'OK',
        onClick: () => {
          modal.dispose()
          let splittedChecksums = [undefined, undefined]
          if (checkSums) {
            splittedChecksums = checkSums.split(';')
          }
          electronApi.requestDecryptFile(
            fileStore?.password ?? '',
            splittedChecksums[0],
            splittedChecksums[1]
          )
        },
        class: 'bg-green-700 text-white'
      },
      {
        text: 'Cancel',
        onClick: () => modal.dispose(),
        class: 'bg-gray-300 text-black'
      }
    ],
    'Insert the encrypted file checksum and the decrypted file checksum separated by ;',
    'prompt',
    () => modal.dispose(),
    (text) => (checkSums = text)
  )
}
</script>

<template>
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
      <li class="mb-1" v-for="file in fileStore.files" :key="file.outputPath">
        <p class="flex flex-col">
          {{ file.outputPath }} - {{ file.outputChecksum }}
          <span class="text-xs">{{ file.inputName }} - {{ file.inputCheckSum }}</span>
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="less"></style>
