# Estado Actual — Presumemi microERP

### Resumen
Cuarta fase de correcciones basada en las reuniones de Insumos y Productos (2026-06-14) y el backlog de v3. Foco en: gestión de categorías (queja del cliente), rework de Insumos y Productos, redefinición del Home, y saldar el backlog técnico pendiente.

### Tarea 1 — Consolidación de Categorías (PRIORIDAD MÁXIMA)
**Problema:** el cliente no puede editar las categorías; hoy solo se leen (`GET`). Requerimiento de 06 Estado Actual: "editar directamente las pills/tags de cada sección del sistema independientemente".

**Enfoque óptimo (a implementar):** pills editables inline en cada sección (Insumos y Productos), CRUD completo:
- **Backend:** agregar `POST/PUT/DELETE` para `categoriaProducto` y `categoriaInsumo` reusando el patrón CRUD existente (soft delete con `activo`, como el resto). En `DELETE`, **guardar contra borrado si hay elementos asociados** (contar `productos`/`insumos`) — bloquear o exigir reasignación; nunca dejar huérfanos (`categoriaId` es FK no-nullable).
- **Frontend:** editor de pills inline — botón `+` al final de la fila de pills para crear al vuelo; renombrar (lápiz/doble clic) y eliminar (con confirm que muestra el conteo de elementos asociados). Reusar `ConfirmDialog.vue`.
- **Decisión:** la gestión va **en cada sección** (no en Ajustes), por el requerimiento de edición independiente. (Deni había sugerido Ajustes "a largo plazo"; se prioriza la edición inline que resuelve la queja ya.)

### Epic A — Insumos
- **A1. Tabla:** eliminar columna "Estado" (redundante con la barra/nivel). Colorear el nivel de stock semánticamente: **naranja** = bajo/crítico, **rojo** = vacío. Alinear columnas numéricas (Stock, Mínimo) a la derecha/centro.
- **A2. Detalle:** se mantiene **edición directa** al hacer clic (decisión tomada).
- **A3. Formulario reordenado en secciones con título:**
  1. *Identificación:* Nombre, Categoría, Unidad de medida.
  2. *Compra y Costo (Presentación):* Costo de la presentación, Cantidad de unidades por presentación, Costo unitario (read-only, calculado).
  3. *Control de Stock:* Stock actual, Stock mínimo.
  4. *Proveedores:* hasta 3, con precio c/u; **Proveedor Principal obligatorio**.
- **A4. Terminología:** reemplazar "paquete"/"pack" (inconsistente) por **"Costo de la presentación"** y **"Cantidad de unidades por presentación"**. La sección de identificación sin recuadro/título; las demás con título.
- **A5. Costo unitario** = costo presentación ÷ cantidad presentación (read-only). El proveedor principal alimenta el costo de referencia usado en recetas (BOM) y presupuestos; en el presupuesto se puede editar la línea sin tocar el maestro.

### Epic B — Productos
- **B1. Favoritos:** estrella `★` para marcar; los favoritos van siempre primero en grid/lista.
- **B2. Filtros por categoría:** clic en la categoría ya activa la **deselecciona** (toggle) y vuelve a mostrar todo.
- **B3. Precios — sugerido vs final:** precio **sugerido/calculado** = costo receta + margen (fijo o %), con **margen configurable por producto**; permitir **precio final manual** que sobreescribe el cálculo.
- **B4. Alerta de margen:** si el precio final < precio sugerido, badge/alerta visual ("estás por debajo de costo").
- **B5. Alerta "Precio desactualizado":** si sube el costo de un insumo y el precio final queda por debajo del nuevo calculado, marcar el producto; **filtro/badge en el catálogo** para verlos en lote.
- **B6. BOM no obligatoria:** único campo obligatorio al crear = Nombre (+ categoría). Al activar "costo por receta", inicializar 1 fila BOM vacía (ya estaba en backlog v3).
- **B7. BOM en unidades base** (cm, hojas), no "rollo", para que el costo unitario y el cruce con stock sean precisos.

### Epic C — Dashboard / Home
- **C1.** Quitar el gráfico de ingresos semanales (PII / datos sensibles a la vista).
- **C2.** Presupuestos recientes: excluir estados finales (facturado, cancelado); mostrar solo activos "trabajables".
- **C3.** Nueva sección **"Próximos a entregar"**: 3 primeros por fecha de entrega.
- **C4.** Sección **"Últimos editados"**: 3 últimos documentos trabajados recientemente.
- **C5.** Redefinir widget "insumos bajos" → **"Capacidad de fabricación"**: cuántas unidades de cada producto se pueden fabricar cruzando su BOM con el stock actual de insumos. Copy: "Capacidad actual: 8 unidades".

### Epic D — Backlog técnico pendiente (de 06 Estado Actual)
| Pendiente | Prioridad |
|---|---|
| Error de signo en Movimiento (Egresos) — enviar monto absoluto, la API ya calcula el signo | Alta |
| Búsqueda global en topbar (UI existe, falta conectar lógica + endpoint multi-entidad) | Alta |
| Paginación en UI (hoy `limit: 100`) | Media |
| Tokenizar colores de canales en Clientes (hardcodeados en JS) | Media |
| Tests Vitest (ya hay 16; ampliar cobertura) | Media |
| Export CSV de tablas | Baja |
| Modo oscuro | Baja |
| Campo Medidas en productos | Baja |
| Sanitizar JSONB de domicilio en Ajustes | Baja |
| Dashboard V2 (widgets personalizables, agenda, top clientes) | Baja |

### Decisiones abiertas (a charlar, registrar sin resolver)
- **FSM presupuestos:** Deni propone que "cerrado" sea el último estado del presupuesto y que la facturación viva solo en Finanzas (desacoplar `facturado` del presupuesto). Pendiente de validar con las usuarias cómo facturan.
- **Costo unitario "barato":** se mantiene la realidad del insumo (sin redondeos), confirmado en reunión.

---

## Orden de ejecución sugerido
1. **Tarea 1 — Categorías** (desbloquea la queja del cliente).
2. **Epic A — Insumos** (raíz de la cadena de costos).
3. **Epic B — Productos** (depende de costos de insumos).
4. **Epic C — Dashboard** (depende de BOM/stock para capacidad de fabricación).
5. **Epic D — Backlog** (priorizando los "Alta": signo Egresos y búsqueda global).

## Verificación
Al ser un documento, la verificación es de contenido: revisar que `01 Estado Actual.md` (a) refleje fielmente las decisiones de ambas reuniones, (b) incorpore los pendientes de 06 Estado Actual sin perder ninguno, (c) marque Categorías como Tarea 1, y (d) registre las decisiones tomadas y las abiertas. Lectura conjunta con el usuario antes de avanzar al primer "Plan de implementacion".