# Módulo Finanzas — Documento Consolidado

## Presumemi · Sistema de Gestión MemyDeni

*Fuente de verdad única · v3.64 · Mayo 2026*

---

## Contexto

El módulo Finanzas registra todos los movimientos de dinero del negocio, parametriza la distribución de ganancias entre las socias y gestiona los pedidos a la imprenta tercerizada (Patri). Reemplaza las hojas "Cuentas 2022/2023/2024/2025" y el registro manual de imprenta.

---

## Tablas del módulo (3 activas \+ 1 postergada)

distribucion\_ganancias   ← P1

transacciones            ← P1

ordenes\_imprenta         ← P2

envios                   ← P3 POSTERGADA

---

## Schema completo

### `distribucion_ganancias`

Parametriza cómo se reparten los ingresos. Solo 3 filas fijas.

CREATE TABLE distribucion\_ganancias (

  id           SERIAL          PRIMARY KEY,

  concepto     VARCHAR(80)     NOT NULL,

  porcentaje   NUMERIC(5,4)    NOT NULL,  \-- 0.4000 \= 40%

  activo       BOOLEAN         DEFAULT true,

  archivado    BOOLEAN         DEFAULT false,

  actualizado\_en TIMESTAMP     DEFAULT NOW()

);

**Seed data:**

| id | concepto | porcentaje | activo | archivado |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Meme | 0.4000 | true | false |
| 2 | Pety | 0.3000 | true | false |
| 3 | Gastos | 0.3000 | true | false |

**Reglas de operación:**

- `archivado = true` → fuerza `activo = false`. Irreversible.  
- `Σ(porcentaje WHERE activo = true) ≤ 1.0000` — validado en capa de aplicación (V13)  
- Una fila con `activo = false` y `archivado = false` puede reactivarse  
- No se pueden agregar ni eliminar filas en v1 — solo modificar porcentajes  
- Se usa SOLO al cambiar un presupuesto a estado `facturado`

---

### `transacciones`

El libro diario del negocio. Registro contable inmutable.

CREATE TABLE transacciones (

  id               SERIAL         PRIMARY KEY,

  fecha            DATE           NOT NULL,

  presupuesto\_id   INT            REFERENCES presupuestos(id),  \-- nullable

  cuenta           VARCHAR(20)    NOT NULL,

    \-- 'banco'|'mercado\_pago'|'efectivo'

  tipo\_movimiento  VARCHAR(20)    NOT NULL,

    \-- ver ENUM completo abajo

  valor            NUMERIC(12,2)  NOT NULL,  \-- positivo=ingreso, negativo=egreso

  detalle          VARCHAR(200),

  nro\_factura      VARCHAR(20),

  creado\_en        TIMESTAMP      DEFAULT NOW()

  \-- sin actualizado\_en — registro inmutable

);

**`tipo_movimiento` — 12 valores:**

ingresos · insumos · cameo · embalaje · meme · pety · gastos ·

iva · monotributo · contadora · comisiones · intereses

**Ejemplos:**

fecha        cuenta          tipo        valor       detalle

2026-06-15   mercado\_pago   ingresos   \+15000.00   Seña P-1119 HP

2026-06-18   efectivo       insumos    \-14600.00   Compra papel A3

2026-06-20   banco          meme       \-7200.00    Retiro Meme P-1119

---

### `ordenes_imprenta`

Registra cada pedido a Patri (imprenta tercerizada).

CREATE TABLE ordenes\_imprenta (

  id               SERIAL         PRIMARY KEY,

  fecha            DATE           NOT NULL,

  presupuesto\_id   INT            REFERENCES presupuestos(id),  \-- nullable

  tematica\_cliente VARCHAR(200),

  cantidad\_hojas   INT,

  tipo\_hoja        VARCHAR(100),

  valor\_nuestro    NUMERIC(12,2),

  valor\_patri      NUMERIC(12,2),

  metodo\_pago      VARCHAR(50),

  pagado           BOOLEAN        DEFAULT false,

  creado\_en        TIMESTAMP      DEFAULT NOW(),

  actualizado\_en   TIMESTAMP      DEFAULT NOW()

);

**Diferencia `valor_nuestro` vs `valor_patri`:** Calculada en frontend: `valor_nuestro − valor_patri`

- Positiva → la estimación cubrió el costo (a favor)  
- Negativa → la estimación quedó corta (en contra) No se persiste en DB — se calcula al renderizar.

---

### `envios` — POSTERGADA

Almacenará datos de despacho para presupuestos con `metodo_envio = 'envio'`. No implementada en v1. Cuando se implemente: `creado_en` ✅, sin `actualizado_en`.

---

## Distribución automática al facturar

Al cambiar `presupuestos.estado` a `'facturado'`, la aplicación ejecuta automáticamente la distribución (V8 — sin triggers en DB):

Ejemplo: presupuesto P-1119 · total $32.900

Lee distribucion\_ganancias:

  Meme   \= 40% → $13.160

  Pety   \= 30% → $9.870

  Gastos \= 30% → $9.870

Genera en transacciones (todos con presupuesto\_id \= 1119):

  ingresos   mercado\_pago  \+17.900  Cobro saldo P-1119

  insumos    —             \-4.200   Costo insumos P-1119

  cameo      —             \-1.800   Costo imprenta P-1119

  meme       banco         \-7.200   Retiro Meme (40%) P-1119

  pety       banco         \-5.400   Retiro Pety (30%) P-1119

  gastos     —             \-x.xxx   Gastos (30%) P-1119

La lógica lee los porcentajes en el momento de ejecutar — si cambian, la distribución de futuros presupuestos se actualiza automáticamente.

---

## UI — Pantallas del módulo

### Finanzas — Solapa Movimientos

- Header: selector de período (mes/año) | Exportar PDF | \+ Nuevo movimiento  
- KPIs: Ingresos | Egresos | Utilidad con comparativo vs mes anterior  
- Filtros: pills por `tipo_movimiento` (12 tipos) \+ pills por `cuenta` (3 opciones)  
- Tabla: Fecha | Tipo | Cuenta | Referencia | Detalle | Nro. Factura | Monto  
- Montos positivos en turquesa `#75CCCE`, negativos en coral `#EA5F3C`  
- Doble click → drawer de edición

**Drawer Nuevo/Editar movimiento:**

- `fecha` (date picker), `tipo_movimiento` (selector), `cuenta` (selector)  
- `valor` con toggle \+ Ingreso / − Egreso  
- `detalle` (texto libre), `nro_factura` (opcional), `presupuesto_id` (autocomplete opcional)  
- Resumen de impacto en tiempo real antes de guardar

### Finanzas — Solapa Imprenta

- Header: \+ Nueva orden  
- Tabla: Fecha | Presupuesto | Temática | Hojas | Tipo hoja | Valor nuestro | Valor Patri | Diferencia | Método pago | Pagado  
- Diferencia calculada en frontend: verde si positiva, coral si negativa  
- Doble click → drawer de edición

---

## Vetos aplicados

| Veto | Descripción |
| :---- | :---- |
| V1 | Sin contabilidad de partida doble — partida simple con ENUM |
| V8 | Sin triggers — distribución automática en capa de aplicación |
| V13 | Sin validación de porcentajes por trigger — controlado por la app |

---

*Módulo Finanzas · Presumemi · v3.64 · Mayo 2026*  
