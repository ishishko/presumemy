# Flujo de Creación de Presupuesto

## Módulo Comercial · MemyDeni

---

## Contexto

El presupuesto es la entidad central de la operación comercial. Vincula un cliente con un conjunto de productos, define las condiciones de pago y entrega, y dispara la distribución contable al facturar. Reemplaza el sistema de carpetas en Google Drive.

---

## Modelo de estados

                    ┌─────────────────┐

                    │    en\_curso     │  ← estado inicial al crear

                    └────────┬────────┘

                             │

              ┌──────────────┼──────────────┐

              │                             │

              ▼                             ▼

    ┌──────────────────┐         ┌──────────────────┐

    │    cancelado     │         │     cerrado      │

    │ (cliente rechaza │         │ (cliente confirma│

    │  o automático)   │         │    el pedido)    │

    └──────────────────┘         └────────┬─────────┘

                                          │

                                          ▼

                                ┌──────────────────┐

                                │    facturado     │

                                │ (diferenciación  │

                                │   contable)      │

                                └──────────────────┘

**Reglas de transición:**

en\_curso   → cancelado   (cliente rechaza o cancelación automática — criterio pendiente)

en\_curso   → cerrado     (cliente confirma el pedido)

cerrado    → facturado   (se emite factura)

No es posible:

  facturado → ningún otro estado

  cancelado → ningún otro estado

  cerrado   → cancelado

---

## Paso 1 — Identificación del pedido

| Campo | Valor ejemplo | Notas |
| :---- | :---- | :---- |
| `numero` | P1119 | Correlativo global incremental. Generado automáticamente |
| `cliente_id` | Valentina Gómez · P1041M | FK → `clientes.id` |
| `tematica` | Harry Potter | Descriptor principal del pedido. Campo libre |
| `estado` | en\_curso | Asignado automáticamente al crear |
| `notas` | Confirmar diseño antes del 20 | Observaciones generales del pedido |

---

## Paso 2 — Fechas

| Campo | Valor ejemplo | Notas |
| :---- | :---- | :---- |
| `fecha_fiesta` | 2026-07-12 | Cuándo es el evento |
| `fecha_entrega` | 2026-07-10 | Cuándo se debe entregar — puede diferir de la fecha del evento |
| `fecha_finalizacion` | — | Se registra al pasar a estado `cerrado` |

fecha\_entrega vs fecha\_fiesta  →  margen de trabajo disponible

fecha\_finalizacion vs fecha\_entrega  →  si el pedido se entregó tarde

---

## Paso 3 — Ítems (detalle\_presupuesto)

Cada ítem es una fila en `detalle_presupuesto`. El `precio_unitario` se congela al momento de agregar el ítem.

| `producto_id` | `descripcion` | `cantidad` | `precio_unitario` | `subtotal` |
| :---- | :---- | :---- | :---- | :---- |
| 1001 | Aplique letra 14cm \- HP | 12 | $1.200 | $14.400 |
| 3045 | Tag personalizado \- HP | 30 | $350 | $10.500 |
| NULL | Armado de mesa dulce | 1 | $8.000 | $8.000 |

total \= Σ(subtotal) \= $32.900   (GENERATED)

**Ítem libre (`producto_id = NULL`):** Permite incluir servicios o extras sin darlos de alta en el catálogo. El `precio_unitario` se ingresa manualmente.

**Congelamiento de precio:**

Si mañana productos.precio\_final sube a $1.500,

este presupuesto mantiene precio\_unitario \= $1.200 intacto.

---

## Paso 4 — Logística

| Campo | Valor ejemplo | Notas |
| :---- | :---- | :---- |
| `metodo_envio` | envio | ENUM: `'retira'` | `'envio'` |
| `lugar_envio` | Av. San Martín 1420, Villa Urquiza | Obligatorio si `metodo_envio = 'envio'` |

Si metodo\_envio \= 'envio' → al cerrar el presupuesto

se puede generar un registro en la tabla envios.

---

## Paso 5 — Condiciones de pago

| Campo | Valor ejemplo | Notas |
| :---- | :---- | :---- |
| `metodo_pago` | Mercado Pago | Campo libre — MP, Efectivo, Transferencia, combinación |
| `monto_seña` | $15.000 | Ingreso manual |
| `monto_resto` | $17.900 | Ingreso manual — independiente del total |

**Independencia de pagos:**

monto\_seña \+ monto\_resto ≠ necesariamente total

Permite registrar descuentos por pago en efectivo u otros acuerdos

sin que el sistema rechace la operación por no cuadrar con el total exacto.

---

## Paso 6 — Flags operativos

| Campo | Valor | Descripción |
| :---- | :---- | :---- |
| `comprar_archivo` | true | El cliente adquiere el archivo de diseño para uso propio |
| `insumos_especiales` | false | El pedido requiere materiales fuera del catálogo habitual |

---

## Resultado — Distribución al facturar

Al pasar a estado `facturado`, la aplicación genera automáticamente registros en `transacciones` leyendo los porcentajes de `distribucion_ganancias`:

distribucion\_ganancias:

  Meme   → 40%

  Pety   → 30%

  Gastos → 30%

Registros generados automáticamente:

  ingresos   \+$17.900   (cobro saldo)

  insumos    −$4.200    (costo materiales)

  cameo      −$1.800    (costo imprenta)

  meme       −$7.200    (retiro Meme 40%)

  pety       −$5.400    (retiro Pety 30%)

  gastos     −$x.xxx    (30% gastos)

Todos vinculados con `presupuesto_id = 1119`. Hoy este proceso se hace a mano — hasta 8 registros por pedido.

---

## Campos de auditoría

| Campo | Aplica | Justificación |
| :---- | :---: | :---- |
| `creado_en` | ✅ | Ciclo de vida con estados |
| `actualizado_en` | ✅ | Ídem |

`detalle_presupuesto` no tiene campos de auditoría — vive del ciclo de vida del presupuesto.

---

## Veto aplicado

**V7 — Sin boolean `facturado` independiente:** El estado `facturado` es el 4to valor del ENUM `estado` — no un campo booleano aparte. Unifica en un solo campo el estado del documento y el estado contable.

---

## Idea pendiente

- **Cancelación automática** — criterio de tiempo a definir. Sin impacto en schema actual. La lógica la ejecuta la aplicación.

---

## Pantalla pendiente de diseño

- **Vista de presupuesto** — cabecera \+ ítems \+ panel de pago \+ indicador de estado con transiciones disponibles

---

*Flujo Creación Presupuesto · Módulo Comercial · MemyDeni · v3.6 · Mayo 2026*  
