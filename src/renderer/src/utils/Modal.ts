import { h, render, VueElement } from "vue";
import ModalComponent from '../components/ModalComponent.vue'

export type IButtons = {
  text: string
  onClick: () => void
  class: string
}

export type ModalType = 'dialog' | 'prompt'

export const Modal = () => {
  let el: HTMLDivElement | null

  return {
    show(
      title: string,
      buttons: IButtons[],
      message: string,
      type: ModalType,
      onClose: () => void,
      onChangeCallback?: (text: string) => void,
      childEl?: VueElement
    ) {
      el = document.createElement('div')
      el.className = 'absolute w-full h-full'
      const child = h(ModalComponent, {
        title: title,
        buttons: buttons,
        message: message,
        type: type,
        onClose: () => {
          onClose()
          if(el)
            el.remove()
        },
        onChangeCallback: onChangeCallback,
        child: childEl
      })

      render(child, el)
      document.body.appendChild(el)
    },
    dispose() {
      if (el) el.remove()
    }
  }
}
