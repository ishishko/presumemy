<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check, Plus, X } from '@lucide/vue'
import { post, put } from '@/shared/api/client'
import { useToast } from '@/shared/lib/useToast'
import type { Cliente, ClienteContacto } from '@/types'
import { clienteSchema } from '@/schemas/clientes'
import DrawerShell from '@/shared/ui/DrawerShell.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FloatingField from '@/shared/ui/FloatingField.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'

const props = defineProps<{
  open: boolean
  cliente?: Cliente | null
}>()

const emit = defineEmits<{
  close: []
  saved: [cliente: Cliente]
}>()

const { toast } = useToast()

const isEdit = computed(() => !!props.cliente)

const nombre = ref('')
const calle = ref('')
const numero = ref('')
const localidad = ref('')
const provincia = ref('')
const notas = ref('')
const contactos = ref<Array<{ canal: ClienteContacto['canal']; valor: string; esPrincipal: boolean }>>([])
const errors = ref<Record<string, string>>({})

function reset() {
  nombre.value = ''
  calle.value = ''
  numero.value = ''
  localidad.value = ''
  provincia.value = ''
  notas.value = ''
  contactos.value = []
  errors.value = {}
}

function loadCliente() {
  reset()
  if (props.cliente) {
    nombre.value = props.cliente.nombre
    if (props.cliente.domicilio) {
      calle.value = props.cliente.domicilio.calle || ''
      numero.value = props.cliente.domicilio.numero || ''
      localidad.value = props.cliente.domicilio.localidad || ''
      provincia.value = props.cliente.domicilio.provincia || ''
    }
    notas.value = props.cliente.notas || ''
    contactos.value = (props.cliente.contactos || []).map(c => ({
      canal: c.canal,
      valor: c.valor,
      esPrincipal: c.esPrincipal,
    }))
  }
  if (contactos.value.length === 0) {
    contactos.value.push({ canal: 'instagram', valor: '', esPrincipal: true })
  }
}

function addContacto() {
  if (contactos.value.length >= 3) return
  contactos.value.push({ canal: 'instagram', valor: '', esPrincipal: false })
}

function removeContacto(idx: number) {
  contactos.value.splice(idx, 1)
  if (contactos.value.length === 0) {
    contactos.value.push({ canal: 'instagram', valor: '', esPrincipal: true })
  }
  if (!contactos.value.some(c => c.esPrincipal)) {
    contactos.value[0].esPrincipal = true
  }
}

function setPrincipal(idx: number) {
  contactos.value.forEach((c, i) => c.esPrincipal = i === idx)
}

function validate(): boolean {
  const result = clienteSchema.safeParse({
    nombre: nombre.value,
    domicilio: { calle: calle.value, numero: numero.value, localidad: localidad.value, provincia: provincia.value },
    notas: notas.value,
    contactos: contactos.value.filter(c => c.valor),
  })
  if (!result.success) {
    errors.value = {}
    result.error.issues.forEach((e: any) => {
      const path = e.path.join('.')
      errors.value[path] = e.message
    })
    return false
  }
  errors.value = {}
  return true
}

async function handleSave() {
  if (!validate()) return

  const payload: any = {
    nombre: nombre.value,
    domicilio: { calle: calle.value, numero: numero.value, localidad: localidad.value, provincia: provincia.value },
    notas: notas.value,
    contactos: contactos.value.filter(c => c.valor),
  }

  try {
    let res: Cliente
    if (isEdit.value && props.cliente) {
      res = await put<Cliente>('/clientes', props.cliente.id, payload)
      toast('Cliente actualizado')
    } else {
      res = await post<Cliente>('/clientes', payload)
      toast('Cliente creado')
    }
    emit('saved', res)
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al guardar', 'error')
  }
}

const showConfirmExit = ref(false)

const dirty = computed(() => {
  if (isEdit.value) {
    if (!props.cliente) return false
    const c = props.cliente
    const dom = c.domicilio || {}
    const initContacts = (c.contactos || []).map(co => ({
      canal: co.canal,
      valor: co.valor,
      esPrincipal: co.esPrincipal,
    }))
    const currentContacts = contactos.value.map(co => ({
      canal: co.canal,
      valor: co.valor,
      esPrincipal: co.esPrincipal,
    }))
    return (
      nombre.value !== c.nombre ||
      calle.value !== (dom.calle || '') ||
      numero.value !== (dom.numero || '') ||
      localidad.value !== (dom.localidad || '') ||
      provincia.value !== (dom.provincia || '') ||
      notas.value !== (c.notas || '') ||
      JSON.stringify(currentContacts) !== JSON.stringify(initContacts)
    )
  } else {
    const currentContacts = contactos.value.filter(co => co.valor)
    return (
      nombre.value !== '' ||
      calle.value !== '' ||
      numero.value !== '' ||
      localidad.value !== '' ||
      provincia.value !== '' ||
      notas.value !== '' ||
      currentContacts.length > 0
    )
  }
})

function handleClose() {
  if (dirty.value) {
    showConfirmExit.value = true
  } else {
    emit('close')
  }
}

watch(() => props.open, (open) => {
  if (open) loadCliente()
})

defineExpose({ loadCliente })
</script>

<template>
  <DrawerShell
    :open="open"
    :title="isEdit ? cliente!.nombre : 'Crear cliente'"
    :eyebrow="isEdit ? 'Editar cliente' : 'Nuevo cliente'"
    @close="handleClose"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div>
          <FloatingField
            id="cl-nombre"
            label="Nombre"
            required
            v-model="nombre"
            placeholder="Nombre del cliente"
            :invalid="!!errors.nombre"
            :describedby="errors.nombre ? 'cl-nombre-err' : undefined"
            autofocus
          />
          <p v-if="errors.nombre" id="cl-nombre-err" class="text-12 text-coral-500 mt-1 m-0" role="alert">{{ errors.nombre }}</p>
        </div>

        <div class="text-11 uppercase tracking-[0.06em] text-ink-muted font-medium mt-3">Domicilio</div>

        <div class="flex gap-3">
          <div class="flex-[2]">
            <FloatingField id="cl-calle" label="Calle" v-model="calle" />
          </div>
          <div class="flex-1">
            <FloatingField id="cl-numero" label="Número" v-model="numero" />
          </div>
        </div>

        <div class="flex gap-3">
          <div class="flex-1">
            <FloatingField id="cl-localidad" label="Localidad" v-model="localidad" />
          </div>
          <div class="flex-1">
            <FloatingField id="cl-provincia" label="Provincia" v-model="provincia" />
          </div>
        </div>

        <div class="text-11 uppercase tracking-[0.06em] text-ink-muted font-medium mt-3 flex justify-between items-center select-none">
          Contactos
          <span class="text-11 text-ink-muted/75 normal-case tracking-normal">· hasta 3</span>
        </div>

        <div v-for="(c, idx) in contactos" :key="idx" class="flex items-center gap-2">
          <select
            class="w-[120px] shrink-0 box-border font-sans text-13 text-ink bg-surface border border-border-strong rounded-md px-2.5 py-2 outline-none cursor-pointer focus:border-teal-500"
            v-model="c.canal"
          >
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="mail">Mail</option>
            <option value="otros">Otros</option>
          </select>
          <input
            class="flex-1 box-border font-sans text-13 text-ink bg-surface border border-border-strong rounded-md px-3 py-2 outline-none focus:border-teal-500"
            v-model="c.valor"
            placeholder="Valor"
          />
          <button
            type="button"
            class="w-4.5 h-4.5 rounded-full border border-border-strong bg-surface cursor-pointer flex items-center justify-center shrink-0 transition-colors duration-120 hover:border-violet-700"
            :class="[c.esPrincipal ? 'border-violet-700!' : '']"
            @click="setPrincipal(idx)"
            :title="c.esPrincipal ? 'Contacto principal' : 'Marcar como principal'"
          >
            <span v-if="c.esPrincipal" class="w-2.5 h-2.5 rounded-full bg-violet-700" />
          </button>
          <button
            type="button"
            class="bg-transparent border-0 text-ink-muted cursor-pointer p-1 rounded-md flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:text-coral-500 hover:bg-coral-50"
            @click="removeContacto(idx)"
            :disabled="contactos.length <= 1"
            title="Eliminar contacto"
          >
            <X :size="14" />
          </button>
        </div>

        <button
          type="button"
          class="self-start bg-transparent border border-dashed border-border-strong text-violet-700 text-12 font-medium px-3.5 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors duration-120 disabled:opacity-50 disabled:pointer-events-none hover:bg-violet-50 hover:border-violet-700"
          @click="addContacto"
          :disabled="contactos.length >= 3"
        >
          <Plus :size="14" /> Agregar contacto
        </button>

        <div class="mt-3">
          <FloatingField
            id="cl-notas"
            label="Notas"
            multiline
            v-model="notas"
            placeholder="Información interna · solo visible para tu equipo"
          />
        </div>
      </div>
    </template>

    <template #foot>
      <BaseButton variant="ghost" @click="handleClose">Cancelar</BaseButton>
      <BaseButton variant="primary" @click="handleSave">
        <Check :size="16" /> {{ isEdit ? 'Guardar cambios' : 'Crear cliente' }}
      </BaseButton>
    </template>
  </DrawerShell>

  <ConfirmDialog
    :open="showConfirmExit"
    title="¿Salir sin guardar?"
    message="Tenés cambios pendientes en este cliente. Si salís ahora, vas a perderlos."
    confirm-label="Salir sin guardar"
    cancel-label="Seguir editando"
    variant="danger"
    @confirm="emit('close'); showConfirmExit = false"
    @cancel="showConfirmExit = false"
  />
</template>
