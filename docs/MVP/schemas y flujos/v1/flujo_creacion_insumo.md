# Flujo de Creación de Insumo

## Módulo Productos · MemyDeni

---

## Contexto

Un insumo es una materia prima que se compra en pack y se consume por unidad. El flujo de creación captura tanto los datos de identidad como la lógica de costeo que alimenta la BOM (receta) de los productos.

---

## Paso 1 — Datos de identidad

| Campo | Valor ejemplo | Notas |
| :---- | :---- | :---- |
| `nombre` | Papel fotográfico A3 300gr | Nombre descriptivo completo — marca \+ medida \+ gramaje si aplica |
| `categoria_insumo_id` | 2 — Papel Impreso | FK → `categorias_insumo`. Define el tipo de material |
| `unidad_medida` | hoja | Cómo se consume: hoja, plancha, cm, ml, unidad |
| `activo` | true | Borrado lógico — se desactiva en lugar de eliminar |

---

## Paso 2 — Datos de compra

| Campo | Valor ejemplo | Notas |
| :---- | :---- | :---- |
| `costo_paquete` | $14.600 | Lo que se paga al proveedor por el pack completo |
| `cantidad_por_pack` | 100 hojas | Cuántas unidades trae ese pack |

**Cálculo automático:**

costo\_unitario \= costo\_paquete ÷ cantidad\_por\_pack

costo\_unitario \= $14.600 ÷ 100 \= $146 por hoja

`costo_unitario` es un campo GENERATED — no se ingresa manualmente.

---

## Paso 3 — El costo unitario

El campo `costo_unitario` es el valor clave que usa la BOM para calcular el costo de cada producto.

| Campo | Valor | Tipo |
| :---- | :---- | :---- |
| `costo_paquete` | $14.600 | Ingreso manual |
| `cantidad_por_pack` | 100 | Ingreso manual |
| `costo_unitario` | $146 / hoja | GENERATED automático |
| `fecha_actualizacion` | 2026-05-06 | Se registra automáticamente |

**Regla de nomenclatura:**

costo\_  →  valor que MemyDeni paga (nunca precio\_)

precio\_ →  exclusivo de productos — valor que MemyDeni cobra

---

## Paso 4 — Asignación de proveedores

Se vinculan a través de la tabla `insumo_proveedor`. Máximo 3 proveedores por insumo.

| Campo | Proveedor 1 | Proveedor 2 | Proveedor 3 |
| :---- | :---- | :---- | :---- |
| `proveedor_id` | Papelera del Norte | Distribuidora Sur | — |
| `precio_referencia` | $14.600 | $15.200 | — |
| `es_principal` | true | false | — |

**Regla de gobernanza:**

insumo\_proveedor.precio\_referencia  →  fuente de entrada (dato por proveedor)

insumos.costo\_paquete               →  valor canónico operativo

insumos.costo\_unitario              →  valor GENERATED que usa la BOM

La aplicación ejecuta la actualización de `costo_paquete` explícitamente cuando el usuario lo indica — no es automática (consistente con V8: sin triggers complejos).

Solo puede haber un `es_principal = true` por insumo. Si se marca otro como principal, el anterior pasa a `false`.

---

## Paso 5 — Notas

| Campo | Valor ejemplo |
| :---- | :---- |
| `notas` | Disponible en A3 y A4. El A3 300gr es el más usado en letras y papercraft. |

Campo libre para observaciones operativas. No impacta en cálculos.

---

## Resultado final

Con el insumo creado, ya puede aparecer en la tabla `costo_producto_insumo` como componente de la receta de cualquier producto.

**Ejemplo de uso en BOM:**

Si un producto usa 0.5 hojas de este insumo:

  subtotal \= 0.5 × $146 \= $73

---

## Campos de auditoría

| Campo | Aplica | Justificación |
| :---- | :---: | :---- |
| `creado_en` | ✅ | El precio cambia frecuentemente — interesa el histórico |
| `actualizado_en` | ✅ | Ídem |

---

## Pantalla de creación de insumos (pendiente de diseño)

- Formulario completo en pasos: identidad → compra → costo unitario → proveedores → notas → confirmación  
- **Flujo corto desde Finanzas** — al registrar una transacción de compra, permitir crear un insumo con campos reducidos sin pasar por el flujo completo

---

*Flujo Creación Insumo · Módulo Productos · MemyDeni · v3.6 · Mayo 2026*  
