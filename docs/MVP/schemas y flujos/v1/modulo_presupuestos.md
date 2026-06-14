# Módulo Presupuestos — Documento Consolidado

## Presumemi · Sistema de Gestión MemyDeni

*Fuente de verdad única · v3.64 · Mayo 2026* *Reemplaza: modulo\_comercial.md*

---

## Contexto

El módulo Presupuestos es el núcleo operativo del sistema. Vincula un cliente con un conjunto de productos o servicios, define las condiciones de pago y entrega, y dispara la distribución contable al facturar.

---

## Tablas del módulo (2)

presupuestos

detalle\_presupuesto

---

## Schema completo

### `presupuestos`

CREATE TABLE presupuestos (

  id                   SERIAL        PRIMARY KEY,

  numero               INT           UNIQUE NOT NULL,

  cliente\_id           INT           NOT NULL REFERENCES clientes(id),

  tematica             VARCHAR(200),

  estado               VARCHAR(20)   NOT NULL DEFAULT 'borrador',

    \-- 'borrador'|'enviado'|'en\_curso'|'cerrado'|'facturado'|'cancelado'

  fecha\_fiesta         DATE,

  fecha\_entrega        DATE,

  fecha\_finalizacion   DATE,

  metodo\_envio         VARCHAR(10),  \-- 'retira'|'envio'

  lugar\_envio          JSONB,

  metodo\_pago          VARCHAR(100),

  monto\_seña           NUMERIC(12,2),

  monto\_resto          NUMERIC(12,2),

  total                NUMERIC(12,2) DEFAULT 0,

  notas                TEXT,

  notas\_en\_documento   BOOLEAN       DEFAULT false,

  creado\_en            TIMESTAMP     DEFAULT NOW(),

  actualizado\_en       TIMESTAMP     DEFAULT NOW()

);

**Estructura JSONB de `lugar_envio`:**

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

Pre-populado desde `clientes.domicilio` al seleccionar el cliente. Editable de forma aislada — no modifica el domicilio del cliente.

**`total`:** la aplicación actualiza este campo como `Σ(detalle_presupuesto.subtotal)` al guardar.

**`monto_seña` / `monto_resto`:** independientes del total. Permiten descuentos o acuerdos especiales sin validación cruzada.

**`notas_en_documento`:** cuando `true`, las notas aparecen en el PDF/vista web del presupuesto. Default `false`.

---

### `detalle_presupuesto`

CREATE TABLE detalle\_presupuesto (

  id               SERIAL         PRIMARY KEY,

  presupuesto\_id   INT            NOT NULL REFERENCES presupuestos(id),

  producto\_id      INT            REFERENCES productos(id),  \-- nullable

  descripcion      TEXT,

  cantidad         NUMERIC(10,3)  NOT NULL DEFAULT 1,

  precio\_unitario  NUMERIC(12,2)  NOT NULL DEFAULT 0,

  subtotal         NUMERIC(12,2)  GENERATED ALWAYS AS

                     (cantidad \* precio\_unitario) STORED,

  orden            INT            DEFAULT 0

);

**Congelamiento de precio (V2):** `precio_unitario` se copia desde `productos.precio_final` al agregar el ítem y no cambia si el precio del producto cambia posteriormente.

**Ítem libre:** `producto_id = NULL` — servicios o extras sin catálogo. `precio_unitario` se ingresa manualmente.

---

## Relaciones internas

presupuestos ──1:N──► detalle\_presupuesto

## Dependencias cross-módulo

presupuestos.cliente\_id ──► Módulo Clientes: clientes.id

detalle\_presupuesto.producto\_id ──► Módulo Productos: productos.id

presupuestos.id ──► Módulo Finanzas: transacciones.presupuesto\_id

presupuestos.id ──► Módulo Finanzas: ordenes\_imprenta.presupuesto\_id

---

## FSM — Estados de presupuesto

borrador ──► enviado ──► en\_curso ──► cerrado ──► facturado

   │              │           │

   ▼              ▼           ▼

(eliminar)    cancelado   cancelado

                  ↑

          en\_curso ──► borrador

          (requiere guardar o enviar en el mismo acto)

### Definición de estados

| Estado | Label UI | Color badge | Descripción |
| :---- | :---- | :---- | :---- |
| `borrador` | Borrador | Gris `#E0E0E0` / `#616161` | Editable. No visible al cliente. Eliminable permanentemente. |
| `enviado` | Enviado | Lavanda `#DBA8CD` / `#5A1A50` | Solo lectura comercial. Activa cancelación automática si está habilitada. |
| `en_curso` | Confirmado | Amarillo `#F8D132` / `#7A5D00` | En producción. Editable solo en campos no comerciales. |
| `cerrado` | Cerrado | Turquesa `#75CCCE` / `#1E5C5E` | Entregado. Se registra `fecha_finalizacion`. |
| `facturado` | Cobrado | Menta `#D0EADD` / `#1E5C3A` | Pago recibido. Dispara distribución automática. **Irreversible.** |
| `cancelado` | Cancelado | Coral `#EA5F3C` / `#FFFFFF` | Registro histórico. **Irreversible.** |

### Transiciones permitidas

| Desde | Hacia | Quién |
| :---- | :---- | :---- |
| `borrador` | `enviado` | Usuario |
| `borrador` | eliminado permanentemente | Usuario |
| `enviado` | `en_curso` | Usuario |
| `enviado` | `cancelado` | Usuario o sistema (tiempo) |
| `en_curso` | `cerrado` | Usuario |
| `en_curso` | `cancelado` | Usuario |
| `en_curso` | `borrador` | Usuario (requiere guardar/enviar) |
| `cerrado` | `facturado` | Usuario |

### Razones de cancelación (en campo `notas`)

- `Cancelado: Presupuesto rechazado por el cliente — [usuario] [fecha]`  
- `Cancelado por [usuario] — [fecha]`  
- `Cancelado: Tiempo de confirmación excedido — [fecha]` (sistema)

---

## Lógica de negocio

### Guardado

- No hay autosave — siempre explícito  
- Validación mínima: al menos un campo completado O una línea con datos  
- Alerta "¿Salir sin guardar?" si hay cambios pendientes sin guardar  
- El presupuesto no existe en DB hasta la primera acción de guardar

### Cancelación automática

- Solo desde estado `enviado`  
- Controlada por `configuracion_negocio.cancelacion_automatica_activa`  
- Días: `configuracion_negocio.cancelacion_dias_espera` (default 7\)

### Duplicar presupuesto

- Copia todos los campos \+ líneas del presupuesto origen  
- Nuevo `id` (SERIAL) y `numero` correlativo  
- Estado inicial: siempre `borrador`  
- `creado_en` / `actualizado_en` regenerados con timestamp actual  
- Líneas de `detalle_presupuesto` duplicadas con nuevos `id` propios

### Distribución al facturar

Al cambiar a `facturado` la aplicación genera registros en `transacciones` leyendo `distribucion_ganancias`. Ver `modulo_finanzas.md`.

---

## UI — Pantallas del módulo

### Lista de Presupuestos

**Filtros:** pills Todos / Borrador / Enviado / Confirmado / Cerrado / Cobrado / Cancelado

**Columnas:** Folio | Cliente | Evento | Fecha fiesta | Fecha entrega | Creado | Estado | Total

- Anchos de columna ajustables directamente en pantalla  
- Doble click en fila → formulario (fade-in/fade-out)  
- Botón "+ Nuevo presupuesto" en `#75CCCE`  
- Animación "Nuevo presupuesto": latido de derecha → aside

**Menú `...` por fila:**

| Acción | Borrador | Enviado | Confirmado | Cerrado | Cobrado | Cancelado |
| :---- | :---: | :---: | :---: | :---: | :---: | :---: |
| Duplicar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cambiar estado | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Eliminar | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cancelar | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Formulario de Presupuesto

**Layout:** pantalla completa, aside opaco. Split 50/50: formulario izquierda / preview PDF derecha. Preview vacía con placeholder hasta el primer guardado. Se actualiza en cada "Guardar borrador" o "Enviar".

**Tab order:** ① Cliente (autocomplete) → ② Temática → ③ Fecha fiesta → ④ Fecha entrega → ⑤ Método de envío → ⑥ Lugar de envío (si aplica) → ⑦ Método de pago → ⑧ Monto seña → ⑨ Monto resto → ⑩ Tabla de líneas → ⑪ Notas \+ checkbox `notas_en_documento`

Flujo siempre hacia adelante. Tab nunca reinicia desde ①.

**Tabla de líneas — comportamiento spreadsheet:**

| Tecla | Comportamiento |
| :---- | :---- |
| `Tab` | Avanza a siguiente celda |
| `Shift+Tab` | Retrocede a celda anterior |
| `Enter` en celda con datos | Crea nueva línea, foco en Producto |
| `Enter` en Producto vacío | Sale de tabla → foco en Notas |
| `↑` / `↓` | Mueve foco en misma columna |
| `Escape` | Cancela edición y revierte |
| `Delete` en celda vacía | No borra — requiere acción en 🗑 |

**Reglas de filas:**

- Solo la primera fila puede estar vacía (estado inicial)  
- Al `blur` sobre la tabla → última fila vacía colapsa en botón `+ Agregar línea`  
- Click o Enter en botón → se expande como fila editable

**Autocompletado de producto:**

Usuario escribe → debounce 300ms → busca en catálogo

  ├─ Con resultados → dropdown → seleccionar → pre-popula precio

  └─ Sin resultados → ítem libre → precio manual

**Prevención de eventos no deseados:**

- `Enter` dentro de la tabla → `preventDefault()` — no manda el form  
- `Tab` en última celda → crear nueva línea, no salir del form  
- Scroll en campos numéricos → desactivado (`inputmode="numeric"`)  
- Drag accidental → umbral mínimo antes de activar reordenamiento  
- Caracteres no numéricos en Precio/Cant → filtrado de input

**Botones de acción (fijos al fondo):** `Cancelar` | `Guardar borrador` | `Enviar →`

---

## Vetos aplicados

| Veto | Descripción |
| :---- | :---- |
| V2 | Sin SCD Type 2 — precio congelado en `detalle_presupuesto` |
| V4 | Sin hard delete — solo `borrador` es eliminable |
| V8 | Sin triggers — distribución ejecutada por la aplicación |

---

## V2 — Mejoras registradas

- Templates de presupuesto para agilizar carga recurrente  
- Formulario de cancelación con selector de razón en modal

---

*Módulo Presupuestos · Presumemi · v3.64 · Mayo 2026*  
