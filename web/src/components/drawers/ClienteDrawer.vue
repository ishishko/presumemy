<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check, Plus, X } from '@lucide/vue'
import { post, put } from '@/services/api'
import { useToast } from '@/composables/useToast'
import type { Cliente, ClienteContacto } from '@/types'
import { clienteSchema } from '@/schemas/clientes'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

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
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-container">
        <div class="drawer-scrim" @click="handleClose"></div>
        <aside class="drawer-panel">
          <div class="drawer-head">
            <div class="drawer-title-block">
              <span class="drawer-eyebrow">{{ isEdit ? 'Editar cliente' : 'Nuevo cliente' }}</span>
              <h3>{{ isEdit ? cliente!.nombre : 'Crear cliente' }}</h3>
            </div>
            <div class="spacer"></div>
            <button class="icon-btn" @click="handleClose" title="Cerrar">
              <X :size="18" />
            </button>
          </div>

          <div class="drawer-body">
            <div class="field" :class="{ 'field-error': errors.nombre }">
              <label for="cl-nombre">Nombre</label>
              <input
                id="cl-nombre"
                class="input"
                v-model="nombre"
                placeholder="Nombre del cliente"
                autofocus
              />
              <span v-if="errors.nombre" class="field-error-msg">{{ errors.nombre }}</span>
            </div>

            <div class="fd-section-label" style="margin-top: 18px">Domicilio</div>

            <div class="fd-row">
              <div class="field" style="flex: 2">
                <label for="cl-calle">Calle</label>
                <input id="cl-calle" class="input" v-model="calle" placeholder="Calle" />
              </div>
              <div class="field" style="flex: 1">
                <label for="cl-numero">Número</label>
                <input id="cl-numero" class="input" v-model="numero" placeholder="N°" />
              </div>
            </div>

            <div class="fd-row">
              <div class="field" style="flex: 1">
                <label for="cl-localidad">Localidad</label>
                <input id="cl-localidad" class="input" v-model="localidad" placeholder="Localidad" />
              </div>
              <div class="field" style="flex: 1">
                <label for="cl-provincia">Provincia</label>
                <input id="cl-provincia" class="input" v-model="provincia" placeholder="Provincia" />
              </div>
            </div>

            <div class="fd-section-label" style="margin-top: 18px">
              Contactos
              <span class="hint" style="font-weight: 400; text-transform: none; letter-spacing: 0">· hasta 3</span>
            </div>

            <div v-for="(c, idx) in contactos" :key="idx" class="contacto-row">
              <select class="select contacto-select" v-model="c.canal">
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="mail">Mail</option>
                <option value="otros">Otros</option>
              </select>
              <input
                class="input contacto-input"
                v-model="c.valor"
                placeholder="Valor"
              />
              <button
                type="button"
                :class="['contacto-radio', { checked: c.esPrincipal }]"
                @click="setPrincipal(idx)"
                :title="c.esPrincipal ? 'Contacto principal' : 'Marcar como principal'"
              />
              <button
                class="contacto-del"
                @click="removeContacto(idx)"
                :disabled="contactos.length <= 1"
                title="Eliminar contacto"
              >
                <X :size="14" />
              </button>
            </div>

            <button
              class="add-contacto-btn"
              @click="addContacto"
              :disabled="contactos.length >= 3"
            >
              <Plus :size="14" /> Agregar contacto
            </button>

            <div class="field" style="margin-top: 18px">
              <label for="cl-notas">Notas</label>
              <textarea
                id="cl-notas"
                class="textarea"
                v-model="notas"
                placeholder="Información interna · solo visible para tu equipo"
                rows="3"
              />
            </div>
          </div>

          <div class="drawer-foot">
            <button class="btn btn-ghost" @click="handleClose">Cancelar</button>
            <button class="btn btn-primary" @click="handleSave">
              <Check :size="16" /> {{ isEdit ? 'Guardar cambios' : 'Crear cliente' }}
            </button>
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
.drawer-container {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
}

.drawer-scrim {
  position: absolute;
  inset: 0;
  background: rgba(28, 26, 30, 0.40);
  pointer-events: auto;
}

.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 520px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: grid;
  grid-template-rows: auto 1fr auto;
  pointer-events: auto;
  box-shadow: var(--shadow-2);
  z-index: 81;
}

.drawer-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.drawer-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.drawer-eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  font-weight: 500;
}

.drawer-head h3 {
  font-size: 17px;
  font-weight: 500;
  margin: 0;
  line-height: 1.2;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px;
}

.drawer-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--border);
  justify-content: flex-end;
}

.spacer { flex: 1; }

.fd-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.fd-section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  font-weight: 500;
  margin-bottom: 10px;
}

.contacto-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.contacto-select { width: 120px; flex-shrink: 0; }
.contacto-input { flex: 1; }

.contacto-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  background: var(--surface);
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: border-color 120ms ease;
}

.contacto-radio.checked {
  border-color: var(--violet-700);
}

.contacto-radio.checked::after {
  content: "";
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--violet-700);
}

.contacto-del {
  background: transparent;
  border: 0;
  color: var(--ink-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: grid;
  place-items: center;
}

.contacto-del:hover { color: var(--coral-500); background: var(--coral-50); }
.contacto-del:disabled { opacity: 0.3; pointer-events: none; }

.add-contacto-btn {
  align-self: flex-start;
  background: transparent;
  border: 1px dashed var(--border-strong);
  color: var(--violet-700);
  font-size: 12px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 120ms ease, border-color 120ms ease;
}

.add-contacto-btn:hover { background: var(--violet-50); border-color: var(--violet-700); }
.add-contacto-btn:disabled { opacity: 0.5; pointer-events: none; }

.field-error .input,
.field-error .select,
.field-error .textarea {
  border-color: var(--coral-500);
}

.field-error-msg {
  font-size: 12px;
  color: var(--coral-500);
  margin-top: 4px;
}

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
