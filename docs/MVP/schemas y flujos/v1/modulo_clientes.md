# Módulo Clientes — Documento Consolidado

## Presumemi · Sistema de Gestión MemyDeni

*Fuente de verdad única · v3.64 · Mayo 2026*

---

## Contexto

El módulo Clientes gestiona las personas que realizan pedidos a MemyDeni. No contempla campos B2B (CUIT, razón social, condición tributaria). Los canales de contacto viven en una tabla separada para soportar N canales sin alterar el schema (V12).

---

## Tablas del módulo (2)

clientes

cliente\_contactos

---

## Schema completo

### `clientes`

CREATE TABLE clientes (

  id                   SERIAL        PRIMARY KEY,

  codigo\_identificador VARCHAR(20)   GENERATED ALWAYS AS ('C-' || id::TEXT) STORED,

  nombre               VARCHAR(200)  NOT NULL,

  domicilio            JSONB,

  notas                TEXT,

  activo               BOOLEAN       DEFAULT true,

  creado\_en            TIMESTAMP     DEFAULT NOW(),

  actualizado\_en       TIMESTAMP     DEFAULT NOW()

);

**`codigo_identificador`:** GENERATED — siempre `C-{id}`. Ejemplos: `C-1`, `C-42`, `C-1001`. Inmutable, no editable.

**Estructura JSONB de `domicilio`:**

{

  "calle": "",

  "numero": "",

  "piso\_depto": "",

  "ciudad": "",

  "provincia": "",

  "codigo\_postal": "",

  "pais": "",

  "referencia": ""

}

`piso_depto` y `referencia` son opcionales. `domicilio` se copia a `presupuestos.lugar_envio` al seleccionar el cliente. Las ediciones en el presupuesto no modifican `clientes.domicilio`.

**Campos eliminados (V6, V12):** Sin CUIT, razón social, condición tributaria, ni columnas fijas de contacto.

---

### `cliente_contactos`

CREATE TABLE cliente\_contactos (

  id           SERIAL        PRIMARY KEY,

  cliente\_id   INT           NOT NULL REFERENCES clientes(id),

  tipo         VARCHAR(20)   NOT NULL,

    \-- 'instagram'|'whatsapp'|'mail'|'otros'

  valor        VARCHAR(200)  NOT NULL,

  es\_principal BOOLEAN       DEFAULT false

);

**Reglas:**

- Sin límite de contactos por cliente  
- Solo un `es_principal = true` por cliente  
- Si se marca uno nuevo como principal, el anterior pasa a `false`  
- El canal principal se muestra en la lista de clientes  
- Sin campos de auditoría — dato simple que vive del ciclo de vida del cliente

---

## Relaciones internas

clientes ──1:N──► cliente\_contactos

## Dependencias cross-módulo

clientes.id ──► presupuestos.cliente\_id  (Módulo Presupuestos)

clientes.domicilio ──► presupuestos.lugar\_envio  (pre-populado)

---

## Lógica de negocio

### Creación de cliente

- Campo obligatorio: `nombre`  
- Al menos un canal de contacto recomendado  
- `codigo_identificador` generado automáticamente al insertar  
- `activo = true` por defecto

### Eliminación

- Borrado lógico: `activo = false`  
- Clientes con presupuestos vinculados no se pueden desactivar sin confirmación explícita  
- Los registros históricos en `presupuestos` se preservan siempre

### Pre-populado de domicilio en presupuesto

Al seleccionar cliente en formulario de presupuesto:

  SI clientes.domicilio IS NOT NULL

  Y metodo\_envio \= 'envio'

  ENTONCES copiar domicilio a presupuestos.lugar\_envio

---

## UI — Pantallas del módulo

### Lista de Clientes

**Columnas:** Avatar \+ Nombre \+ Canal principal | Código | Último pedido | Pedidos | Total facturado

- Subtítulo dinámico: "X clientes · X activos"  
- Sin columna Etiqueta  
- Doble click en fila → detalle (fade-in/fade-out)  
- Botón "+ Nuevo cliente" en `#75CCCE`  
- Animación "Nuevo cliente": latido de derecha → aside

**Avatar:**

- Iniciales del nombre en color derivado del id del cliente  
- Colores de la paleta de marca

### Detalle de Cliente

**Layout:**

┌─────────────────────────┬──────────────────────────┐

│     IDENTIDAD           │   DOMICILIO              │

├─────────────────────────┴──────────────────────────┤

│              CANALES DE CONTACTO                    │

├────────────────────────────────────────────────────┤

│              HISTORIAL DE PRESUPUESTOS              │

└────────────────────────────────────────────────────┘

- Pantalla completa — aside visible y opaco  
- Todo editable inline  
- Animación de entrada: fade-in/fade-out (desde doble click)

**Columna izquierda — Identidad:**

- Avatar grande con iniciales  
- `nombre` — editable inline  
- `codigo_identificador` — badge solo lectura  
- Mini estadísticas: pedidos totales \+ total facturado \+ último pedido  
- `notas` — textarea editable  
- Toggle "Cliente activo · Visible en búsquedas y presupuestos"

**Columna derecha — Domicilio:** Campos editables inline con hint "Pre-completa el envío en presupuestos":

- `calle`, `numero`, `piso_depto` (opcional)  
- `ciudad`, `provincia`, `pais`  
- `codigo_postal`, `referencia` (opcional)

**Sección canales de contacto:** Tabla spreadsheet con columnas: Canal (selector) | Valor | Principal (radio único) | 🗑

- Mismo comportamiento de teclado que formulario de presupuesto  
- Hint: "Hasta N contactos · marcá uno como principal"  
- Botón "+ Agregar contacto"

**Sección historial de presupuestos:** Tabla solo lectura: Folio | Evento | Fecha | Estado (badge) | Total

- Click en fila → navega al presupuesto

**Barra de acciones (fija al fondo):** `← Volver a clientes` | `Guardar cambios` (activo solo con cambios) | `Eliminar cliente`

- Alerta "¿Salir sin guardar?" si hay cambios pendientes  
- "Eliminar" \= borrado lógico con confirmación

---

## Vetos aplicados

| Veto | Descripción |
| :---- | :---- |
| V4 | Sin hard delete — borrado lógico con `activo` |
| V6 | Sin campos B2B |
| V12 | Sin columnas fijas de contacto en `clientes` |

---

## V2 — Mejoras registradas

- Estado de cuenta en lista: "Facturado: $X / Por cobrar: $X"  
- Filtro por canal de contacto principal en la lista

---

*Módulo Clientes · Presumemi · v3.64 · Mayo 2026*  
