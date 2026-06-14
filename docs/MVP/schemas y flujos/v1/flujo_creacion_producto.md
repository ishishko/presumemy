# Flujo de Creación de Producto

## Módulo Productos · MemyDeni

---

## Contexto

Un producto es la unidad vendible del catálogo. Su precio de venta se calcula a partir del costo de sus insumos (BOM) más una ganancia configurable. El flujo captura la identidad, la receta, la ganancia y la aprobación del precio final.

---

## Paso 1 — Datos básicos (ventana de creación)

| Campo | Valor ejemplo | Notas |
| :---- | :---- | :---- |
| `nombre` | Vaso polipapel personalizado | Nombre descriptivo completo |
| `codigo` | 9001 | Generado automáticamente: prefijo\_categoria \+ correlativo. No se ingresa a mano |
| `categoria_id` | 9 — Varios | FK → `categorias_producto`. El prefijo determina el rango del código |
| `medida` | 250ml · 8cm alto | Dimensiones físicas del producto |
| `descripcion` | Vaso de polipapel con impresión full color en una cara | Texto libre explicativo — campo independiente de medida |
| `activo` | true | Borrado lógico |

---

## Paso 2 — BOM (Lista de materiales)

El BOM se gestiona desde la **vista del producto** mediante un botón "+" posterior al ítem "Lista de Materiales". Se agrega desde un **modal emergente** con fila editable.

### Dos modos de costo:

| `tiene_bom` | Comportamiento |
| :---- | :---- |
| `false` | `costo_producto` se ingresa manualmente |
| `true` | `costo_producto` \= Σ subtotales de `costo_producto_insumo` (no editable directamente) |

### Ejemplo de receta:

| tipo\_costo | Insumo | cantidad\_usada | costo\_unitario\_local | subtotal |
| :---- | :---- | :---- | :---- | :---- |
| insumo | Vaso polipapel | 1.00 | $240 | $240 |
| insumo | IMP. ilustración A3 | 0.20 | $900 | $180 |
| insumo | Barra pistolita | 0.10 | $293 | $29 |
| cameo | Corte Bajo | 0.20 | $221 | $44 |
| extra | Tiempo de armado | — | — | $100 |

costo\_producto \= Σ subtotales \= $593

### Regla de aislamiento (V11):

costo\_unitario\_local se inicializa con insumos.costo\_unitario

al momento de agregar el ítem desde el modal BOM.

Ediciones posteriores en el modal afectan SOLO a esta fila.

No se propagan a insumos.costo\_unitario ni a otros productos

que usen el mismo insumo.

**Nota:** Los cortes Cameo (Máximo / Medio / Bajo) son insumos de la categoría "Cortes" — no una tabla separada.

---

## Paso 3 — Ganancia

El campo de ganancia soporta dos modos configurables:

| `tipo_ganancia` | Fórmula | Ejemplo |
| :---- | :---- | :---- |
| `'porcentaje'` | `costo_producto × (1 + valor_ganancia / 100)` | $593 × 1.80 \= $1.067 |
| `'absoluto'` | `costo_producto + valor_ganancia` | $593 \+ $500 \= $1.093 |

tipo\_ganancia  \=  'porcentaje'

valor\_ganancia \=  80

precio\_calculado \= $593 × (1 \+ 80/100) \= $1.067   (GENERATED)

---

## Paso 4 — Precio final

| Campo | Valor | Notas |
| :---- | :---- | :---- |
| `precio_calculado` | $1.067 | GENERATED — no editable |
| `precio_final` | $1.100 | Aprobado manualmente — puede diferir del calculado |
| `precio_ambientadora` | $1.300 | Variante para canal de venta alternativo |
| `validacion` | ok | GENERATED automático |

**Lógica de `validacion`:**

precio\_final IS NULL OR \= 0      →  'sin\_precio'

precio\_final \< precio\_calculado  →  'error'

precio\_final ≥ precio\_calculado  →  'ok'

---

## Resultado final

El producto queda disponible para ser usado en presupuestos. El `precio_final` es el valor que se congela en `detalle_presupuesto` al momento de emisión.

precio\_final congelado en detalle\_presupuesto \= $1.100

Si mañana cambia un insumo y precio\_calculado sube a $1.200,

el presupuesto ya emitido NO se altera.

---

## Campos de auditoría

| Campo | Aplica | Justificación |
| :---- | :---: | :---- |
| `creado_en` | ✅ | El catálogo evoluciona |
| `actualizado_en` | ✅ | Ídem |

---

## Pantallas pendientes de diseño

- **Ventana de creación de producto** — formulario con campos básicos de identidad (Paso 1\)  
- **Vista de producto** — incluye sección BOM con botón "+" para agregar materiales  
- **Modal de BOM** — modal emergente con fila editable, autocompletado de insumos y precios editables localmente

---

*Flujo Creación Producto · Módulo Productos · MemyDeni · v3.6 · Mayo 2026*  
