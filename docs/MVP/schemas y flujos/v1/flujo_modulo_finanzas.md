# Flujo del Módulo Finanzas

## Módulo Finanzas · MemyDeni

---

## Contexto

El módulo Finanzas registra todos los movimientos de dinero del negocio, parametriza cómo se distribuyen las ganancias entre las socias y gestiona los pedidos a la imprenta tercerizada. Reemplaza las hojas "Cuentas 2022/2023/2024/2025" y el registro manual de imprenta.

---

## Tabla 1 — distribucion\_ganancias

Parametriza cómo se reparten los ingresos. Solo 3 filas — una por concepto.

| `id` | `concepto` | `porcentaje` | `activo` | `archivado` |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Meme | 0.4000 | true | false |
| 2 | Pety | 0.3000 | true | false |
| 3 | Gastos | 0.3000 | true | false |

**Reglas de operación:**

1\. archivado \= true  →  fuerza activo \= false.

   Una fila archivada nunca puede volver a activarse.

2\. Σ(porcentaje WHERE activo \= true) ≤ 1.0000

   Si al insertar o modificar una fila activa el total supera 1.0000,

   la aplicación rechaza la operación con error explícito.

   Controlado en capa de aplicación (V8: sin triggers complejos).

3\. Una fila con activo \= false y archivado \= false

   puede reactivarse en el futuro.

**¿Cuándo se usa?** Solo al cambiar el presupuesto a estado `facturado`. La aplicación lee estos porcentajes y genera los registros en `transacciones`.

---

## Tabla 2 — transacciones

El libro diario del negocio. Cada fila es un movimiento de dinero.

**Estructura:**

| Campo | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador |
| `fecha` | DATE | Fecha del movimiento |
| `presupuesto_id` | INT FK NULLABLE | Vínculo opcional con un pedido |
| `cuenta` | ENUM | `'banco'` | `'mercado_pago'` | `'efectivo'` |
| `tipo_movimiento` | ENUM | Ver detalle abajo |
| `valor` | NUMERIC(12,2) | Positivo \= ingreso · Negativo \= egreso |
| `detalle` | VARCHAR(200) | Descripción libre |
| `nro_factura` | VARCHAR(20) | Cuando aplica |
| `creado_en` | TIMESTAMP | Registro contable inmutable — sin `actualizado_en` |

**`tipo_movimiento` ENUM — mapea exactamente las columnas de las planillas históricas:**

ingresos · insumos · cameo · embalaje · meme · pety · gastos ·

iva · monotributo · contadora · comisiones · intereses

**Ejemplos de filas:**

fecha        cuenta          tipo          valor      detalle

2026-06-15   mercado\_pago   ingresos     \+$15.000   Seña P1119 HP

2026-06-18   efectivo       insumos      −$14.600   Compra papel A3

2026-06-20   banco          meme         −$7.200    Retiro Meme P1119

---

## Distribución automática al facturar

Al cambiar `presupuestos.estado` a `'facturado'`, la aplicación genera automáticamente hasta 8 registros en `transacciones`. Hoy esto se hace manualmente — es uno de los principales cuellos de botella operativos.

Presupuesto P1119 · total $32.900

Registros generados automáticamente:

  ingresos   mercado\_pago   \+$17.900   Cobro saldo P1119

  insumos    —              −$4.200    Costo insumos P1119

  cameo      —              −$1.800    Costo imprenta P1119

  meme       banco          −$7.200    Retiro Meme (40%)

  pety       banco          −$5.400    Retiro Pety (30%)

  gastos     —              −$x.xxx    Gastos (30%)

Todos los registros llevan `presupuesto_id = 1119`. La lógica lee los porcentajes de `distribucion_ganancias` — si cambian, la distribución se actualiza automáticamente.

---

## Tabla 3 — ordenes\_imprenta

Registra cada pedido a Patri (imprenta tercerizada).

| Campo | Valor ejemplo | Notas |
| :---- | :---- | :---- |
| `fecha` | 2026-06-18 | — |
| `presupuesto_id` | 1119 | Nullable — algunos pedidos son compras generales sin presupuesto |
| `tematica_cliente` | Harry Potter | — |
| `cantidad_hojas` | 12 | — |
| `tipo_hoja` | ilustración 300gr A3 | — |
| `valor_nuestro` | $3.200 | Estimación interna |
| `valor_patri` | $2.900 | Lo que factura la imprenta |
| `metodo_pago` | mercado\_pago | — |
| `pagado` | true | — |

**Diferencia `valor_nuestro` vs `valor_patri`:**

$3.200 − $2.900 \= $300 a favor

Permite auditar si la estimación fue precisa o no.

**Campos de auditoría:** `creado_en` ✅ · `actualizado_en` ✅

---

## Tabla 4 — envios

**Estado: postergada — revisión diferida a etapa posterior.**

Almacenará datos completos de destinatario y remitente para presupuestos con `metodo_envio = 'envio'`. Permitirá generar etiquetas de envío sin reingresar datos.

**Campos de auditoría cuando se implemente:** `creado_en` ✅ · sin `actualizado_en` (registro inmutable)

---

## Relaciones del módulo

distribucion\_ganancias

  └── referenciada al distribuir ganancias al facturar

presupuestos.estado → 'facturado'

  └──► transacciones (hasta 8 filas por pedido — automático)

presupuestos

  ├──► ordenes\_imprenta (nullable)

  └──► envios (si metodo\_envio \= 'envio') — postergado

---

## Vetos aplicados

| Veto | Descripción |
| :---- | :---- |
| V1 | Sin contabilidad de partida doble — `transacciones` usa partida simple categorizada |
| V8 | Sin triggers complejos — la distribución la ejecuta la aplicación |
| V13 | Sin validación de porcentajes por trigger — la regla Σ ≤ 100% la controla la aplicación |

---

*Flujo Módulo Finanzas · MemyDeni · v3.6 · Mayo 2026*  
