<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="absolute w-full h-full bg-black bg-opacity-70">
    <div class="relative flex flex-col justify-center items-center w-full h-full">
      <div class="rounded-md max-w-[60%] min-w-[40%] min-h-40px z-20">
        <div class="w-full bg-gray-900 rounded-t-md px-2 py-2">
          <h1 class="font-bold text-xl text-white">{{ props.title }}</h1>
        </div>
        <div class="bg-gray-600 px-2 py-2 flex flex-col justify-center">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less"></style>
