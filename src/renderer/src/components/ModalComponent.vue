<script setup lang="ts">
import { PropType, VueElement } from "vue";
import { IButtons, ModalType } from "../utils/Modal";

const props = defineProps({
  buttons: {
    type: Array as PropType<IButtons[]>,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String as PropType<ModalType>,
    required: true
  },
  onClose: {
    type: Function,
    required: true
  },
  onChangeCallback: {
    type: Function,
    required: false
  },
  child: {
    type: VueElement,
    required: false
  }
})
</script>

<template>
  <div class="relative flex flex-col justify-center items-center w-full h-full">
    <div class="rounded-md max-w-[60%] min-w-[40%] min-h-40px z-20">
      <div class="w-full bg-gray-900 rounded-t-md px-2 py-2">
        <h1 class="font-bold text-xl text-white">{{ props.title }}</h1>
      </div>
      <div class="bg-gray-600 px-2 py-2 flex flex-col justify-center">
        <p class="text-white whitespace-pre-line">{{ message }}</p>
        {{ props.child }}
        <div v-if="props.type === 'prompt'">
          <input
            class="rounded-md w-full bg-gray-300 mt-4 text-black"
            type="password"
            :onchange="(e) => props.onChangeCallback && props.onChangeCallback(e.target.value)"
          />
        </div>
      </div>
      <div class="w-full min-h-[40px] bg-gray-900 px-2 py-2 rounded-b-md flex items-center justify-end">
        <button
          v-for="button in props.buttons"
          :key="button.text"
          class="ml-2 px-4 py-1 text-sm rounded-2xl"
          type="button"
          :class="button.class"
          :onclick="button.onClick"
        >
          {{ button.text }}
        </button>
      </div>
    </div>
    <div
      :onclick="props.onClose"
      class="absolute flex flex-col justify-center items-center bg-black bg-opacity-70 h-full w-full cursor-point z-10"
    ></div>
  </div>
</template>

<style scoped lang="less"></style>
