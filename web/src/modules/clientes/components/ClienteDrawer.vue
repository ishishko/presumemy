<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check, Plus, X } from '@lucide/vue'
import { useToast } from '@/shared/lib/useToast'
import { useClientesStore } from '../store'
import type { Cliente, ClienteContacto } from '../types'
import { clienteSchema } from '../schema'
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
const store = useClientesStore()

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
      res = await store.update(props.cliente.id, payload)
      toast('Cliente actualizado')
    } else {
      res = await store.create(payload)
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
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="fixed inset-0 z-80 pointer-events-none">
        <!-- Scrim -->
        <div class="absolute inset-0 bg-ink/40 pointer-events-auto" @click="handleClose"></div>
        
        <!-- Panel -->
        <aside class="absolute top-0 right-0 bottom-0 w-[520px] bg-surface border-l border-border grid grid-rows-[auto_1fr_auto] pointer-events-auto shadow-2 z-81">
          <!-- Header -->
          <div class="flex items-center gap-3.5 px-5.5 py-4.5 border-b border-border">
            <div class="flex flex-col gap-1 flex-1 min-w-0">
              <span class="text-11 uppercase tracking-[0.08em] text-ink-muted font-medium">{{ isEdit ? 'Editar cliente' : 'Nuevo cliente' }}</span>
              <h3 class="text-[17px] font-medium m-0 leading-tight">{{ isEdit ? cliente!.nombre : 'Crear cliente' }}</h3>
            </div>
            <button class="w-8.5 h-8.5 grid place-items-center border border-border bg-surface rounded-lg text-ink cursor-pointer hover:bg-page-bg" @click="handleClose" title="Cerrar">
              <X :size="18" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-5.5">
            <div class="field">
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
              <p v-if="errors.nombre" id="cl-nombre-err" class="text-12 text-coral-500 mt-1" role="alert">{{ errors.nombre }}</p>
            </div>

            <div class="text-11 uppercase tracking-[0.06em] text-ink-muted font-medium mb-2.5 mt-4.5">Domicilio</div>

            <div class="flex gap-3 mb-3">
              <div class="field" style="flex: 2">
                <FloatingField id="cl-calle" label="Calle" v-model="calle" />
              </div>
              <div class="field" style="flex: 1">
                <FloatingField id="cl-numero" label="Número" v-model="numero" />
              </div>
            </div>

            <div class="flex gap-3 mb-3">
              <div class="field" style="flex: 1">
                <FloatingField id="cl-localidad" label="Localidad" v-model="localidad" />
              </div>
              <div class="field" style="flex: 1">
                <FloatingField id="cl-provincia" label="Provincia" v-model="provincia" />
              </div>
            </div>

            <div class="text-11 uppercase tracking-[0.06em] text-ink-muted font-medium mb-2.5 mt-4.5">
              Contactos
              <span class="text-hint font-normal normal-case tracking-normal">· hasta 3</span>
            </div>

            <div v-for="(c, idx) in contactos" :key="idx" class="flex items-center gap-2 mb-2">
              <select class="select w-[120px] shrink-0" v-model="c.canal">
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="mail">Mail</option>
                <option value="otros">Otros</option>
              </select>
              <input
                class="input flex-1"
                v-model="c.valor"
                placeholder="Valor"
              />
              <button
                type="button"
                :class="[
                  'w-4.5 h-4.5 rounded-full border border-border-strong bg-surface cursor-pointer grid place-items-center shrink-0 transition-colors duration-120 hover:border-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                  c.esPrincipal ? 'border-violet-700' : ''
                ]"
                @click="setPrincipal(idx)"
                :title="c.esPrincipal ? 'Contacto principal' : 'Marcar como principal'"
              >
                <span v-if="c.esPrincipal" class="w-2.25 h-2.25 rounded-full bg-violet-700" />
              </button>
              <button
                class="bg-transparent border-0 text-ink-muted cursor-pointer p-1 rounded-sm grid place-items-center hover:text-coral-500 hover:bg-coral-50 disabled:opacity-30 disabled:pointer-events-none"
                @click="removeContacto(idx)"
                :disabled="contactos.length <= 1"
                title="Eliminar contacto"
              >
                <X :size="14" />
              </button>
            </div>

            <button
              class="self-start bg-transparent border border-dashed border-border-strong text-violet-700 text-12 font-medium px-3.5 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 transition-colors duration-120 hover:bg-violet-50 hover:border-violet-700 disabled:opacity-50 disabled:pointer-events-none"
              @click="addContacto"
              :disabled="contactos.length >= 3"
            >
              <Plus :size="14" /> Agregar contacto
            </button>

            <div class="field mt-4.5">
              <FloatingField
                id="cl-notas"
                label="Notas"
                multiline
                v-model="notas"
                placeholder="Información interna · solo visible para tu equipo"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center gap-2.5 px-5.5 py-3.5 border-t border-border justify-end">
            <BaseButton variant="ghost" @click="handleClose">Cancelar</BaseButton>
            <BaseButton variant="primary" @click="handleSave">
              <Check :size="16" /> {{ isEdit ? 'Guardar cambios' : 'Crear cliente' }}
            </BaseButton>
          </div>
        </aside>

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
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Transitions */
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}

.drawer-enter-active .drawer-scrim,
.drawer-leave-active .drawer-scrim {
  transition: opacity 220ms ease;
}

.drawer-enter-from .drawer-scrim,
.drawer-leave-to .drawer-scrim {
  opacity: 0;
}
</style>
