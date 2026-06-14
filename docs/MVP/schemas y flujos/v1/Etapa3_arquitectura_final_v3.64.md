# Arquitectura Final — Sistema de Gestión MemyDeni

## Modelo Relacional · Versión 3.64

**Documento de revisión arquitectónica — Tabla configuracion\_negocio \+ campo stock en productos** *Mayo 2026*

---

## Cambios respecto a v3.63

| \# | Tabla | Cambio | Detalle |
| :---: | :---- | :---- | :---- |
| 1 | `productos` | ✅ Agregar `stock INT DEFAULT 0` | Campo de stock gestionado desde el módulo Productos |
| 2 | `configuracion_negocio` | ✅ Tabla nueva | Configuración global del negocio — gestionada desde Ajustes |

---

## Tabla `productos` — campo nuevo

stock  INT  DEFAULT 0  NOT NULL

**Comportamiento:**

- Gestionado manualmente desde la vista de lista y detalle de Productos  
- No tiene lógica automática de descuento por presupuesto facturado (V8 — sin triggers)  
- Visible en la lista de productos con su unidad de medida  
- El Dashboard muestra alerta de "Insumos bajos" basada en `insumos.stock_actual` — el stock de productos es independiente y no alimenta ese widget en v1

---

## Tabla `configuracion_negocio` — nueva

Registro único por instancia del sistema. Almacena los datos del negocio que aparecen en documentos, PDFs y la interfaz.

CREATE TABLE configuracion\_negocio (

  id                    INT           PRIMARY KEY DEFAULT 1,

  nombre\_negocio        VARCHAR(200),

  logo\_url              TEXT,                    \-- Supabase Storage

  domicilio             JSONB,                   \-- misma estructura que clientes.domicilio

  contacto\_principal    JSONB,                   \-- { canal, valor }

  moneda                VARCHAR(10)   DEFAULT 'ARS',

  cancelacion\_automatica\_activa  BOOLEAN  DEFAULT false,

  cancelacion\_dias\_espera        INT      DEFAULT 7,

  actualizado\_en        TIMESTAMP     DEFAULT NOW()

);

**Restricción:** Solo puede existir una fila (id \= 1). La aplicación usa INSERT ... ON CONFLICT DO UPDATE para actualizar.

### Campos

| Campo | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | INT DEFAULT 1 | Siempre 1 — registro único |
| `nombre_negocio` | VARCHAR(200) | Nombre que aparece en PDFs y la app |
| `logo_url` | TEXT | URL del logo en Supabase Storage |
| `domicilio` | JSONB | Dirección del negocio para PDFs y facturación |
| `contacto_principal` | JSONB | Canal de contacto principal del negocio |
| `moneda` | VARCHAR(10) DEFAULT 'ARS' | Moneda operativa del sistema |
| `cancelacion_automatica_activa` | BOOLEAN DEFAULT false | Cancelación automática de presupuestos |
| `cancelacion_dias_espera` | INT DEFAULT 7 | Días hasta cancelación automática |
| `actualizado_en` | TIMESTAMP | Última vez que se guardó |

### Estructura JSONB de `domicilio`

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

### Estructura JSONB de `contacto_principal`

{

  "canal": "instagram",

  "valor": "@memydeni"

}

**Nota:** Los parámetros `cancelacion_automatica_activa` y `cancelacion_dias_espera` se mueven de una tabla de configuración genérica a `configuracion_negocio` — es su lugar natural.

---

## Relación con módulos

| Módulo UI | Campo leído |
| :---- | :---- |
| PDF del presupuesto | `nombre_negocio`, `logo_url`, `domicilio`, `contacto_principal` |
| Ajustes → Inicio | Todos los campos |
| Ajustes → Presupuestos | `cancelacion_automatica_activa`, `cancelacion_dias_espera` |
| Sidebar / header | `nombre_negocio`, `logo_url` |
| Formateo de montos | `moneda` |

---

## Tabla de auditoría actualizada — v3.64

| Tabla | `creado_en` | `actualizado_en` |
| :---- | :---: | :---: |
| `configuracion_negocio` | — | ✅ |
| `productos` | ✅ (heredado) | ✅ (heredado) |

---

## Schema completo de tablas — v3.64

### Módulo Productos (8 tablas)

`categorias_producto` · `categorias_insumo` · `proveedores` · `insumos` · `insumo_proveedor` · `productos` · `costo_producto_insumo`

+ campo `stock` en `productos`

### Módulo Comercial (4 tablas)

`clientes` · `cliente_contactos` · `presupuestos` · `detalle_presupuesto`

+ campo `domicilio JSONB` en `clientes` (v3.63)  
+ campo `lugar_envio JSONB` en `presupuestos` (v3.63)  
+ ENUM `estado` de 6 valores en `presupuestos` (v3.61)  
+ campo `notas_en_documento BOOLEAN` en `presupuestos` (v3.62)

### Módulo Finanzas (3 tablas activas \+ 1 postergada)

`distribucion_ganancias` · `transacciones` · `ordenes_imprenta` `envios` → postergada

### Configuración (1 tabla)

`configuracion_negocio` ← nueva en v3.64

**Total: 16 tablas activas**

---

*Etapa3 · Arquitectura Final v3.64 · MemyDeni · Mayo 2026*  
