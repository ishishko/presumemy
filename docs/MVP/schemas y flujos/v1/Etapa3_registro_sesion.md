# Registro de Sesión — Arquitectura MemyDeni Etapa 3

## Análisis campo por campo · Versiones 3.0 → 3.6

*Mayo 2026*

---

## Objetivo de la sesión

Revisar, validar y refinar la arquitectura de base de datos generada en la Etapa 2, aplicando el principio de autocontención modular y analizando cada entidad campo por campo. El resultado es la arquitectura definitiva v3.6 con 15 tablas en 3 módulos.

---

## Punto de partida

La Etapa 2 generó un modelo de **13 tablas en 4 módulos**:

- Maestros (4 tablas)  
- Catálogo (3 tablas)  
- Comercial (3 tablas)  
- Finanzas (3 tablas)

La Etapa 3 lo transforma en **15 tablas en 3 módulos autocontenidos**.

---

## Principio arquitectónico aplicado

Cada módulo debe ser **autocontenido**: contener todas las entidades que necesita para funcionar sin depender de entidades de otro módulo.

---

## Decisiones arquitectónicas por versión

### v3.0 — Reorganización modular

- Eliminación del módulo Maestros  
- `categorias_producto` y `categorias_insumo` → Módulo Productos  
- `precios_corte_cameo` → eliminada (sus 3 niveles son insumos en categoría "Cortes")  
- `socios` → Módulo Finanzas  
- Módulo Catálogo renombrado a Módulo Productos  
- Nuevas tablas: `proveedores` e `insumo_proveedor`

### v3.1 — Análisis campo por campo: insumos

- `tipos_insumo` → renombrada a `categorias_insumo`  
- `proveedores` ampliada con `mail`, `canal` ENUM, `direccion`  
- `insumos`: agregado `unidad_medida`, `categoria_insumo_id` (FK faltante)  
- `precio_unitario` → renombrado a `costo_paquete` (regla precio\_ vs costo\_)  
- `tipo_insumo_id` → renombrado a `categoria_insumo_id`  
- Gobernanza del valor: `insumos` es canónica, `insumo_proveedor` es fuente de entrada — la aplicación ejecuta la actualización explícitamente (V8)

### v3.2 — Análisis campo por campo: productos

- `medida` y `descripcion` separados en campos independientes  
- `porcentaje_ganancia` → `tipo_ganancia` ENUM \+ `valor_ganancia` NUMERIC  
- `tiene_bom` BOOLEAN agregado — controla modo de cálculo del costo  
- `costo_total_calculado` → `costo_producto` con comportamiento dual (manual o calculado)  
- `costo_unitario_local` en BOM — aislamiento de precio local al producto (V11)

### v3.3 — Análisis campo por campo: clientes

- Eliminados campos fijos de contacto de `clientes`  
- Nueva tabla `cliente_contactos` (1:N) — N contactos sin límite, extensible (V12)  
- Módulo Comercial: de 3 a 4 tablas

### v3.4 — Análisis campo por campo: presupuestos

- `facturado` BOOLEAN eliminado como campo independiente  
- ENUM `estado` redefinido con 4 valores: `en_curso | cancelado | cerrado | facturado` (V7 actualizado)  
- `detalle_presupuesto` documentada formalmente — vínculo con `presupuestos.total`  
- `monto_seña` y `monto_resto` son independientes — no se calculan entre sí

### v3.5 — Campos de auditoría

- Criterio explícito para `creado_en` / `actualizado_en` en todas las tablas  
- Solo donde tiene sentido operativo — no en tablas fijas ni de relación  
- Idea pendiente registrada: cancelación automática de presupuestos por tiempo

### v3.6 — Módulo Finanzas

- `socios` → renombrada a `distribucion_ganancias`  
- Fila `Gastos` (30%) agregada explícitamente — los 3 conceptos suman 100%  
- Campos `activo` y `archivado` agregados — control de estado independiente  
- Regla del 100%: la aplicación rechaza si Σ porcentajes activos \> 1.0000 (V13)  
- `envios` postergada — revisión diferida a etapa posterior  
- `grupos` eliminado de `clientes`  
- Corrección de gobernanza de proveedores documentada

---

## Arquitectura final — 15 tablas · 3 módulos

### Módulo Productos (7 tablas)

| Tabla | Prioridad |
| :---- | :---: |
| `categorias_producto` | P2 |
| `categorias_insumo` | P2 |
| `proveedores` | P2 |
| `insumos` | P1 |
| `insumo_proveedor` | P2 |
| `productos` | P1 |
| `costo_producto_insumo` | P1 |

### Módulo Comercial (4 tablas)

| Tabla | Prioridad |
| :---- | :---: |
| `clientes` | P2 |
| `cliente_contactos` | P2 |
| `presupuestos` | P1 |
| `detalle_presupuesto` | P1 |

### Módulo Finanzas (4 tablas)

| Tabla | Prioridad |
| :---- | :---: |
| `distribucion_ganancias` | P1 |
| `transacciones` | P1 |
| `ordenes_imprenta` | P2 |
| `envios` | P3 — postergada |

---

## Vetos arquitectónicos vigentes (v3.6)

| ID | Veto |
| :---: | :---- |
| V1 | Sin contabilidad de partida doble |
| V2 | Sin SCD Type 2 — precio congelado en `detalle_presupuesto` |
| V3 | Sin recursividad de categorías |
| V4 | Sin hard delete — borrado lógico con `activo` |
| V5 | Sin FLOAT/REAL — todo monetario en NUMERIC |
| V6 | Sin campos B2B en clientes |
| V7 | Sin boolean `facturado` independiente — 4to estado del ENUM |
| V8 | Sin triggers complejos — lógica en capa de aplicación |
| V9 | Sin MVCC agresivo |
| V10 | Sin tabla unificada de contactos — `clientes` y `proveedores` separados |
| V11 | Sin propagación de precios BOM — ediciones locales al producto |
| V12 | Sin columnas fijas de contacto en `clientes` — viven en `cliente_contactos` |
| V13 | Sin validación de porcentajes por trigger — controlado por la aplicación |

---

## Flujos generados durante la sesión

Cada flujo tiene su propio archivo de documentación detallada.

| Flujo | Archivo | Módulo |
| :---- | :---- | :---- |
| Creación de insumo | `flujo_creacion_insumo.md` | Productos |
| Creación de producto | `flujo_creacion_producto.md` | Productos |
| Creación de cliente | `flujo_creacion_cliente.md` | Comercial |
| Creación de presupuesto | `flujo_creacion_presupuesto.md` | Comercial |
| Módulo Finanzas completo | `flujo_modulo_finanzas.md` | Finanzas |

---

## Ideas de pantallas registradas (pendientes de diseño)

| Idea | Módulo |
| :---- | :---- |
| Ventana de creación de producto — campos básicos | Productos |
| Vista de producto con sección BOM y botón "+" | Productos |
| Modal de BOM — fila editable con autocompletado y precios locales | Productos |
| Pantalla de creación de insumos — flujo en pasos | Productos |
| Flujo corto de insumo desde Finanzas al registrar una compra | Finanzas |
| Pantalla de creación de cliente — formulario mínimo \+ contactos expandibles | Comercial |
| Vista de presupuesto — cabecera \+ ítems \+ pago \+ transiciones de estado | Comercial |

---

## Idea pendiente — sin impacto en schema

- **Cancelación automática de presupuestos** — criterio de tiempo a definir. La lógica la ejecuta la aplicación. No requiere campos adicionales.

---

## Archivos generados en esta sesión

| Archivo | Descripción |
| :---- | :---- |
| `Etapa3_arquitectura_final_v3.0.md` | Reorganización modular inicial |
| `Etapa3_arquitectura_final_v3.1.md` | Análisis insumos |
| `Etapa3_arquitectura_final_v3.2.md` | Análisis productos y BOM |
| `Etapa3_arquitectura_final_v3.3.md` | Análisis clientes y contactos |
| `Etapa3_arquitectura_final_v3.4.md` | Análisis presupuestos y estados |
| `Etapa3_arquitectura_final_v3.5.md` | Campos de auditoría |
| `Etapa3_arquitectura_final_v3.6.md` | Módulo Finanzas — **versión definitiva** |
| `flujo_creacion_insumo.md` | Flujo detallado de creación de insumo |
| `flujo_creacion_producto.md` | Flujo detallado de creación de producto |
| `flujo_creacion_cliente.md` | Flujo detallado de creación de cliente |
| `flujo_creacion_presupuesto.md` | Flujo detallado de creación de presupuesto |
| `flujo_modulo_finanzas.md` | Flujo completo del módulo Finanzas |

---

*Registro de sesión · Arquitectura MemyDeni · Etapa 3 · Mayo 2026*  
