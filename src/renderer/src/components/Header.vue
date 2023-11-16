<script setup lang="ts">
import { EServerStatus, useServerStore } from '../stores/server'
import { electronApi } from '../main'
import { useFileStore } from '../stores/files'
import { Modal } from '../utils/Modal'

electronApi.requestServerInfo()
electronApi.requestOutputPath()
const serverInfo = useServerStore()
const fileInfo = useFileStore()

const getStatusColor = (status: EServerStatus) => {
  switch (status) {
    case EServerStatus.RUNNING:
      return 'text-green-500'
    case EServerStatus.STOPPED:
      return 'text-red-500'
    default:
      return 'text-yellow-500'
  }
}

const getStatusBackground = (status: EServerStatus) => {
  if (status === EServerStatus.RUNNING) return 'bg-red-500'

  return 'bg-green-500'
}

const handleServerStatus = () => {
  if (serverInfo.status !== EServerStatus.RUNNING) {
    electronApi.startServer()
  } else {
    electronApi.stopServer()
  }
}

const copyToClipboard = async (path: string) => {
  await navigator.clipboard.writeText(path)
  alert('Path copied to clipboard')
}

let password = ''

const showPasswordModal = () => {
  const modal = Modal()
  modal.show(
    'Insert Password',
    [
      {
        text: 'Cancel',
        class: 'bg-gray-300 text-black',
        onClick: () => {
          password = ''
          modal.dispose()
        }
      },
      {
        text: 'Save',
        class: 'bg-green-700 text-white',
        onClick: () => {
          fileInfo.setPassword(password)
          modal.dispose()
          password = ''
        }
      }
    ],
    'Insert the password to be used during encryption and decryption of files.\nUse a strong password to protect your data against bruteforce attacks',
    'prompt',
    () => {
      password = ''
    },
    (text: string) => {
      password = text
    }
  )
}
</script>

<template>
  <div class="flex flex-col w-full px-5 py-3">
    <nav class="flex items-center justify-between w-full">
      <h1 class="text-4xl">Crypto Server</h1>
      <div class="flex">
        <div class="items-baseline flex mr-5">
          <p class="font-bold text-xl">
            Password:
            <span class="font-normal text-base">{{ fileInfo.password ? 'Set' : 'Unset' }}</span>
          </p>
          <button
            type="button"
            class="ml-2 px-4 py-1 text-sm text-white rounded-2xl bg-blue-700"
            @click="showPasswordModal"
          >
            Change Password
          </button>
        </div>
        <div class="flex items-baseline">
          <p class="font-bold text-xl mr-5">
            Server:
            <span class="font-normal text-base">
              <span :class="getStatusColor(serverInfo.status)">{{ serverInfo.status }}</span> -
              {{ serverInfo.port }}
            </span>
          </p>
          <button
            type="button"
            :class="getStatusBackground(serverInfo.status)"
            class="px-4 py-1 text-sm text-black rounded-2xl"
            @click="handleServerStatus()"
          >
            {{ serverInfo.status === EServerStatus.RUNNING ? 'Stop' : 'Start' }}
          </button>
        </div>
      </div>
    </nav>
    <div class="mt-2 flex items-center justify-between w-full">
      <h3 class="font-bold">
        Output Path:
        <a class="font-normal" href="#" :onclick="() => electronApi.pickOutput()">{{
          fileInfo.outputPath
        }}</a>
      </h3>
      <button
        class="ml-2 bg-yellow-600 px-4 py-0.5 text-white rounded-2xl"
        :onclick="() => copyToClipboard(fileInfo.outputPath)"
      >
        Copy
      </button>
    </div>
  </div>
</template>

<style scoped lang="less"></style>
