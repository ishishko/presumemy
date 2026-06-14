# Módulo Productos — Documento Consolidado

## Presumemi · Sistema de Gestión MemyDeni

*Fuente de verdad única · v3.64 · Mayo 2026*

---

## Contexto

El módulo Productos gestiona el catálogo de artículos fabricables, los insumos que los componen, los proveedores de esos insumos y los costos de producción. Es el módulo base del sistema — los presupuestos dependen de él.

---

## Tablas del módulo (7)

categorias\_producto

categorias\_insumo

proveedores

insumos

insumo\_proveedor

productos

costo\_producto\_insumo

---

## Schema completo

### `categorias_producto`

Datos fijos — sin campos de auditoría.

CREATE TABLE categorias\_producto (

  id               SERIAL        PRIMARY KEY,

  nombre           VARCHAR(80)   UNIQUE NOT NULL,

  prefijo\_codigo   VARCHAR(4)    NOT NULL

);

**Seed data (9 categorías fijas, no editables desde UI):**

| id | nombre | prefijo | Rango código | Ganancia default |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Box | 1 | 1000–1999 | 100% |
| 2 | Golosinas | 2 | 2000–2999 | 80% |
| 3 | Letras | 3 | 3000–3999 | 100% |
| 4 | PaperCraft | 4 | 4000–4999 | 150% |
| 5 | Banner | 5 | 5000–5999 | 100% |
| 6 | Box 3D | 6 | 6000–6999 | 100% |
| 7 | Aplique | 7 | 7000–7999 | 100% |
| 8 | Tag | 8 | 8000–8999 | 100% |
| 9 | Varios | 9 | 9000–9999 | 100% |

---

### `categorias_insumo`

Datos fijos — sin campos de auditoría.

CREATE TABLE categorias\_insumo (

  id      SERIAL       PRIMARY KEY,

  nombre  VARCHAR(80)  UNIQUE NOT NULL

);

**Seed data (8 categorías fijas):** Papel · Papel Impreso · Pegamentos · Librería · Cortes · Embalaje · Mercería · Varios

---

### `proveedores`

CREATE TABLE proveedores (

  id           SERIAL        PRIMARY KEY,

  nombre       VARCHAR(120)  NOT NULL,

  contacto     VARCHAR(120),

  telefono     VARCHAR(30),

  mail         VARCHAR(120),

  canal        VARCHAR(20),  \-- 'whatsapp'|'instagram'|'mail'|'telefono'|'otros'

  direccion    VARCHAR(200),

  notas        TEXT,

  activo       BOOLEAN       DEFAULT true,

  creado\_en    TIMESTAMP     DEFAULT NOW(),

  actualizado\_en TIMESTAMP   DEFAULT NOW()

);

---

### `insumos`

CREATE TABLE insumos (

  id                   SERIAL         PRIMARY KEY,

  categoria\_insumo\_id  INT            NOT NULL REFERENCES categorias\_insumo(id),

  nombre               VARCHAR(150)   NOT NULL,

  unidad\_medida        VARCHAR(30)    NOT NULL,

  costo\_paquete        NUMERIC(12,2)  NOT NULL DEFAULT 0,

  cantidad\_por\_pack    NUMERIC(10,3)  NOT NULL DEFAULT 1,

  costo\_unitario       NUMERIC(12,4)  GENERATED ALWAYS AS

                         (costo\_paquete / NULLIF(cantidad\_por\_pack, 0)) STORED,

  stock\_actual         INT            DEFAULT 0,

  stock\_minimo         INT            DEFAULT 0,

  fecha\_actualizacion  DATE,

  notas                TEXT,

  activo               BOOLEAN        DEFAULT true,

  creado\_en            TIMESTAMP      DEFAULT NOW(),

  actualizado\_en       TIMESTAMP      DEFAULT NOW()

);

**Reglas:**

- `costo_unitario` es GENERATED — no editable directamente  
- `fecha_actualizacion` se actualiza al guardar cambios en `costo_paquete` o `cantidad_por_pack`  
- Borrado lógico: `activo = false`

**Niveles de stock:**

- Crítico: `stock_actual < stock_minimo × 0.3`  
- Bajo: `stock_actual < stock_minimo`  
- OK: `stock_actual >= stock_minimo`

---

### `insumo_proveedor`

CREATE TABLE insumo\_proveedor (

  id                SERIAL         PRIMARY KEY,

  insumo\_id         INT            NOT NULL REFERENCES insumos(id),

  proveedor\_id      INT            NOT NULL REFERENCES proveedores(id),

  es\_principal      BOOLEAN        DEFAULT false,

  precio\_referencia NUMERIC(10,2),

  actualizado\_en    TIMESTAMP      DEFAULT NOW()

);

**Reglas:**

- Máximo 3 proveedores por insumo  
- Solo un `es_principal = true` por insumo — la aplicación desactiva el anterior  
- `precio_referencia` es fuente de entrada — no actualiza `insumos.costo_paquete` automáticamente (V8)  
- La actualización de `costo_paquete` desde el proveedor es siempre explícita

---

### `productos`

CREATE TABLE productos (

  id               SERIAL         PRIMARY KEY,

  categoria\_id     INT            NOT NULL REFERENCES categorias\_producto(id),

  nombre           VARCHAR(200)   NOT NULL,

  medida           VARCHAR(100),

  descripcion      TEXT,

  tiene\_bom        BOOLEAN        DEFAULT true,

  tipo\_ganancia    VARCHAR(20)    DEFAULT 'porcentaje', \-- 'porcentaje'|'absoluto'

  valor\_ganancia   NUMERIC(8,2)   DEFAULT 0,

  costo\_producto   NUMERIC(12,2)  DEFAULT 0,

  precio\_calculado NUMERIC(12,2)  GENERATED ALWAYS AS (

    CASE

      WHEN tipo\_ganancia \= 'porcentaje'

        THEN costo\_producto \* (1 \+ valor\_ganancia / 100\)

      ELSE costo\_producto \+ valor\_ganancia

    END

  ) STORED,

  precio\_final     NUMERIC(12,2),

  precio\_ambientadora NUMERIC(12,2),

  validacion       VARCHAR(20)    GENERATED ALWAYS AS (

    CASE

      WHEN precio\_final IS NULL OR precio\_final \= 0 THEN 'sin\_precio'

      WHEN precio\_final \< (costo\_producto \* (1 \+ valor\_ganancia / 100)) THEN 'error'

      ELSE 'ok'

    END

  ) STORED,

  stock            INT            DEFAULT 0,

  activo           BOOLEAN        DEFAULT true,

  creado\_en        TIMESTAMP      DEFAULT NOW(),

  actualizado\_en   TIMESTAMP      DEFAULT NOW()

);

**Lógica de `tiene_bom`:**

- `true` → `costo_producto` \= Σ subtotales de `costo_producto_insumo` — calculado, no editable  
- `false` → `costo_producto` se ingresa manualmente

**Código de producto:** se genera como `{prefijo_categoria}{numero_correlativo}` dentro del rango de la categoría. Ej: `1001`, `4023`.

---

### `costo_producto_insumo` (BOM)

CREATE TABLE costo\_producto\_insumo (

  id                  SERIAL         PRIMARY KEY,

  producto\_id         INT            NOT NULL REFERENCES productos(id),

  insumo\_id           INT            REFERENCES insumos(id),  \-- nullable \= ítem libre

  tipo\_costo          VARCHAR(20)    NOT NULL,  \-- 'insumo'|'cameo'|'embalaje'|'extra'

  descripcion         VARCHAR(200),

  cantidad            NUMERIC(10,3)  NOT NULL DEFAULT 1,

  costo\_unitario\_local NUMERIC(12,4) NOT NULL DEFAULT 0,

  subtotal            NUMERIC(12,2)  GENERATED ALWAYS AS

                        (cantidad \* costo\_unitario\_local) STORED,

  orden               INT            DEFAULT 0

);

**Regla de aislamiento (V11):**

- `costo_unitario_local` se inicializa con `insumos.costo_unitario` al agregar la fila  
- Ediciones posteriores afectan SOLO a esta fila — no propagan a `insumos` ni a otros productos

---

## Relaciones internas

categorias\_producto ──► productos

categorias\_insumo   ──► insumos

proveedores ──M:N (vía insumo\_proveedor)──► insumos

insumos ──M:N (vía costo\_producto\_insumo)──► productos

## Dependencia cross-módulo

productos.id ◄── detalle\_presupuesto.producto\_id  (Módulo Comercial)

---

## Lógica de negocio

### Cálculo de costo con BOM

costo\_producto \= Σ(costo\_producto\_insumo.subtotal)

               \= Σ(cantidad × costo\_unitario\_local)

### Cálculo de precio

tipo\_ganancia \= 'porcentaje':

  precio\_calculado \= costo\_producto × (1 \+ valor\_ganancia / 100\)

tipo\_ganancia \= 'absoluto':

  precio\_calculado \= costo\_producto \+ valor\_ganancia

precio\_final \= override manual del precio\_calculado

### Validación

precio\_final IS NULL OR \= 0  →  'sin\_precio'

precio\_final \< precio\_calculado  →  'error'

precio\_final \>= precio\_calculado  →  'ok'

---

## UI — Pantallas del módulo

### Lista de Productos

- Vista toggle: Grid (4 columnas) / Lista (tabla)  
- Filtros por categoría: pills dinámicos desde `categorias_producto`  
- Columnas lista: Foto | Código | Nombre | Categoría | Medida | Stock | Precio final | Precio ambientadora  
- Anchos de columna ajustables  
- Doble click → detalle (fade-in/fade-out)  
- Productos con `activo = false` no se muestran

### Detalle de Producto

- Layout 3 columnas (fotos / identidad / precios) \+ BOM ancho completo  
- Hasta 3 fotos por producto (Supabase Storage)  
- Todo editable inline  
- BOM con comportamiento spreadsheet (mismo que formulario de presupuesto)  
- Barra fija: Volver | Guardar cambios | Eliminar

### Lista de Insumos

- Tabla con columnas: Insumo | Categoría | Stock (con unidad) | Mínimo (con unidad) | Costo unitario | Proveedor principal | Nivel (barra) | Estado  
- Filtros: pills por Estado (Crítico/Bajo/OK) y por Categoría  
- Doble click → detalle

### Detalle de Insumo

- Layout 2 columnas (identidad/stock | compra/costos) \+ proveedores \+ notas  
- Todo editable inline  
- Sección proveedores con comportamiento spreadsheet

---

## Vetos aplicados

| Veto | Descripción |
| :---- | :---- |
| V3 | Sin recursividad de categorías |
| V4 | Sin hard delete — borrado lógico con `activo` |
| V5 | Sin FLOAT — todo NUMERIC |
| V8 | Sin triggers — lógica en capa de aplicación |
| V11 | Aislamiento de costo en BOM — ediciones locales no propagan |

---

*Módulo Productos · Presumemi · v3.64 · Mayo 2026*  
