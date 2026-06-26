import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ConfirmDialog from '../ConfirmDialog.vue'

describe('ConfirmDialog.vue', () => {
  // Usamos el stub de Teleport para simplificar los asserts en testing unitario,
  // permitiendo que el componente renderice su contenido de forma local en el wrapper.
  const mountOptions = {
    global: {
      stubs: {
        teleport: true,
      },
    },
  }

  it('no debería renderizar nada si open es false', () => {
    const wrapper = mount(ConfirmDialog, {
      ...mountOptions,
      props: {
        open: false,
        title: 'Confirmación',
        message: '¿Estás seguro de continuar?',
      },
    })

    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('debería renderizar la estructura completa si open es true', () => {
    const wrapper = mount(ConfirmDialog, {
      ...mountOptions,
      props: {
        open: true,
        title: 'Confirmar eliminación',
        message: 'Esta acción es irreversible y afectará el catálogo',
      },
    })

    expect(wrapper.find('.fixed').exists()).toBe(true)
    expect(wrapper.find('h4').text()).toBe('Confirmar eliminación')
    expect(wrapper.find('p').text()).toBe('Esta acción es irreversible y afectará el catálogo')

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toBe('Cancelar')
    expect(buttons[1].text()).toBe('Confirmar')
  })

  it('debería mostrar etiquetas de botones personalizadas si se proveen', () => {
    const wrapper = mount(ConfirmDialog, {
      ...mountOptions,
      props: {
        open: true,
        title: 'Título',
        message: 'Mensaje',
        confirmLabel: 'Sí, borrar',
        cancelLabel: 'No, mantener',
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons[0].text()).toBe('No, mantener')
    expect(buttons[1].text()).toBe('Sí, borrar')
  })

  it('debería usar la clase bg-coral-500 para el botón de confirmar si la variante es danger', () => {
    const wrapper = mount(ConfirmDialog, {
      ...mountOptions,
      props: {
        open: true,
        title: 'Título',
        message: 'Mensaje',
        variant: 'danger',
      },
    })

    const confirmBtn = wrapper.findAll('button')[1]
    expect(confirmBtn.classes()).toContain('bg-coral-500')
    expect(confirmBtn.classes()).not.toContain('bg-teal-500')
  })

  it('debería emitir "confirm" al presionar el botón de confirmar', async () => {
    const wrapper = mount(ConfirmDialog, {
      ...mountOptions,
      props: {
        open: true,
        title: 'Título',
        message: 'Mensaje',
      },
    })

    const confirmBtn = wrapper.findAll('button')[1]
    await confirmBtn.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('confirm')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('debería emitir "cancel" al presionar el botón de cancelar', async () => {
    const wrapper = mount(ConfirmDialog, {
      ...mountOptions,
      props: {
        open: true,
        title: 'Título',
        message: 'Mensaje',
      },
    })

    const cancelBtn = wrapper.findAll('button')[0]
    await cancelBtn.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('cancel')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('debería emitir "cancel" al hacer clic en el fondo de máscara', async () => {
    const wrapper = mount(ConfirmDialog, {
      ...mountOptions,
      props: {
        open: true,
        title: 'Título',
        message: 'Mensaje',
      },
    })

    const mask = wrapper.find('.fixed')
    await mask.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('cancel')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('debería emitir "cancel" al presionar la tecla Escape', async () => {
    const wrapper = mount(ConfirmDialog, {
      ...mountOptions,
      props: {
        open: true,
        title: 'Título',
        message: 'Mensaje',
      },
    })

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(escapeEvent)

    expect(wrapper.emitted()).toHaveProperty('cancel')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
