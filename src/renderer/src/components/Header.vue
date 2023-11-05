<script setup lang="ts">
import { EServerStatus, useServerStore } from '../stores/server'
import { electronApi } from '../main'

electronApi.requestServerInfo()
const serverInfo = useServerStore()

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
</script>

<template>
  <nav class="flex items-center justify-between w-full">
    <h1 class="text-4xl">Crypto Server</h1>
    <div class="flex">
      <div class="items-baseline mr-5">
        <p class="font-bold text-xl">Password: <span class="font-normal text-base">Unset</span></p>
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
</template>

<style scoped lang="less"></style>
