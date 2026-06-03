/* global React, I, money, moneyShort */
// Pantalla "Detalle de insumo" — full-content takeover (sidebar opaco visible).
// Expone: InsumoDetalleScreen, INSUMOS_RICH, INSUMO_CATEGORIES, PROVEEDORES.

const { useState: useIState, useMemo: useIMemo, useEffect: useIEffect, useRef: useIRef } =
  React;

/* =========================================================
   Datos
   ========================================================= */
const INSUMO_CATEGORIES = [
  "Papel", "Papel Impreso", "Pegamentos", "Librería",
  "Cortes", "Embalaje", "Mercería", "Varios",
];

const PROVEEDORES = [
  "Distribuidora Papelera Norte",
  "Librería Central",
  "Empaques del Pacífico",
  "Mercerías Don Lalo",
  "Cortes Express",
  "Insumos GMD",
  "Papelería La Estrella",
  "Imprenta Aurora",
];

const INSUMOS_RICH = [
  { code: "I-1001", name: "Cartulina opalina 220 g",  cat: "Papel",         stock: 18,  min: 30,  unit: "pliego",    costoPaquete: 220, cantidadPack: 10,  proveedorPrincipal: "Distribuidora Papelera Norte" },
  { code: "I-1002", name: "Papel kraft 70 g",          cat: "Papel",         stock: 8,   min: 15,  unit: "pliego",    costoPaquete: 180, cantidadPack: 10,  proveedorPrincipal: "Distribuidora Papelera Norte" },
  { code: "I-1003", name: "Papel madera A4",           cat: "Papel Impreso", stock: 4,   min: 20,  unit: "paquete",   costoPaquete: 320, cantidadPack: 4,   proveedorPrincipal: "Imprenta Aurora" },
  { code: "I-1004", name: "Tarjetería impresa cumple", cat: "Papel Impreso", stock: 28,  min: 12,  unit: "u",         costoPaquete: 240, cantidadPack: 24,  proveedorPrincipal: "Imprenta Aurora" },
  { code: "I-1005", name: "Pegamento blanco 250 ml",   cat: "Pegamentos",    stock: 12,  min: 8,   unit: "bote",      costoPaquete: 195, cantidadPack: 3,   proveedorPrincipal: "Insumos GMD" },
  { code: "I-1006", name: "Cinta doble faz 1 cm",      cat: "Pegamentos",    stock: 2,   min: 8,   unit: "rollo",     costoPaquete: 360, cantidadPack: 12,  proveedorPrincipal: "Insumos GMD" },
  { code: "I-1007", name: "Cinta dorada 5 m",          cat: "Mercería",      stock: 3,   min: 10,  unit: "rollo",     costoPaquete: 175, cantidadPack: 5,   proveedorPrincipal: "Mercerías Don Lalo" },
  { code: "I-1008", name: "Listón satín 1 cm",         cat: "Mercería",      stock: 24,  min: 20,  unit: "m",         costoPaquete: 160, cantidadPack: 20,  proveedorPrincipal: "Mercerías Don Lalo" },
  { code: "I-1009", name: "Etiqueta circular 3 cm",    cat: "Librería",      stock: 320, min: 100, unit: "u",         costoPaquete: 90,  cantidadPack: 60,  proveedorPrincipal: "Papelería La Estrella" },
  { code: "I-1010", name: "Stickers transparentes A4", cat: "Librería",      stock: 7,   min: 20,  unit: "hoja",      costoPaquete: 240, cantidadPack: 10,  proveedorPrincipal: "Papelería La Estrella" },
  { code: "I-1011", name: "Cúter de precisión",        cat: "Cortes",        stock: 5,   min: 4,   unit: "u",         costoPaquete: 280, cantidadPack: 4,   proveedorPrincipal: "Cortes Express" },
  { code: "I-1012", name: "Repuestos cúter pack 10",   cat: "Cortes",        stock: 8,   min: 12,  unit: "pack",      costoPaquete: 110, cantidadPack: 1,   proveedorPrincipal: "Cortes Express" },
  { code: "I-1013", name: "Bolsa kraft con visor",     cat: "Embalaje",      stock: 60,  min: 40,  unit: "u",         costoPaquete: 220, cantidadPack: 25,  proveedorPrincipal: "Empaques del Pacífico" },
  { code: "I-1014", name: "Caja golosinera 12×12",     cat: "Embalaje",      stock: 22,  min: 30,  unit: "u",         costoPaquete: 380, cantidadPack: 10,  proveedorPrincipal: "Empaques del Pacífico" },
  { code: "I-1015", name: "Cinta dorada glitter 2 cm", cat: "Mercería",      stock: 18,  min: 10,  unit: "rollo",     costoPaquete: 240, cantidadPack: 6,   proveedorPrincipal: "Mercerías Don Lalo" },
  { code: "I-1016", name: "Pintura acrílica blanca",   cat: "Varios",        stock: 2,   min: 6,   unit: "bote",      costoPaquete: 290, cantidadPack: 4,   proveedorPrincipal: "Insumos GMD" },
  { code: "I-1017", name: "Crayolas pastel 12 pcs",    cat: "Varios",        stock: 9,   min: 8,   unit: "caja",      costoPaquete: 145, cantidadPack: 3,   proveedorPrincipal: "Librería Central" },
  { code: "I-1018", name: "Plantillas Mickey set 4",   cat: "Cortes",        stock: 4,   min: 10,  unit: "plantilla", costoPaquete: 320, cantidadPack: 4,   proveedorPrincipal: "Cortes Express" },
];

// Computa el nivel: critico (< 50% del mínimo), bajo (< mínimo), ok (>= mínimo).
const computeNivel = (i) => {
  const s = parseFloat(i.stock) || 0;
  const m = parseFloat(i.min)   || 0;
  if (m <= 0) return s > 0 ? "ok" : "critico";
  if (s < m * 0.5) return "critico";
  if (s < m)       return "bajo";
  return "ok";
};

const NIVEL_META = {
  critico: { label: "Crítico", color: "#EA5F3C", bg: "#FCEAE4", barClass: "low"  },
  bajo:    { label: "Bajo",    color: "#8A6A00", bg: "#FFF6D6", barClass: "warn" },
  ok:      { label: "OK",      color: "#1F5A3E", bg: "#D0EADD", barClass: "ok"   },
};

// Date utility for "fecha_actualizacion"
const fmtDate = (d) => {
  if (!d) return "—";
  const date = (d instanceof Date) ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const day  = String(date.getDate()).padStart(2, "0");
  const mes  = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][date.getMonth()];
  const year = date.getFullYear();
  const hh   = String(date.getHours()).padStart(2, "0");
  const mm   = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${mes} ${year} · ${hh}:${mm}`;
};

const moneyI = (n) =>
  "$ " + Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const newRowId = (() => { let i = 0; return () => ++i; })();

/* =========================================================
   Estilos específicos
   ========================================================= */
function InsumoDetalleStyles() {
  return (
    <style>{`
      .id-overlay {
        position: fixed;
        top: 0; right: 0; bottom: 0; left: 240px;
        z-index: 30;
        background: var(--page-bg);
        opacity: 1;
        display: grid;
        grid-template-rows: auto 1fr auto;
        min-height: 0;
        animation: id-slide-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        overflow: hidden;
      }
      .id-overlay.closing {
        animation: id-slide-out 200ms cubic-bezier(0.4, 0, 1, 1) both;
        pointer-events: none;
      }
      @keyframes id-slide-in {
        from { transform: translateY(6px); }
        to   { transform: translateY(0); }
      }
      @keyframes id-slide-out {
        from { transform: translateY(0); }
        to   { transform: translateY(4px); }
      }

      .id-head {
        display: flex; align-items: center; gap: 14px;
        padding: 18px 28px;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
      }
      .id-head .id-title { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
      .id-head .id-title .eyebrow {
        font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
        color: var(--ink-muted); font-weight: 500;
        display: flex; align-items: center; gap: 8px;
      }
      .id-head .id-title .eyebrow .code {
        color: var(--violet-700); font-variant-numeric: tabular-nums;
        font-family: var(--font-mono);
      }
      .id-head .id-title h2 { font-size: 22px; line-height: 1.1; margin: 0; }
      .id-head .dirty-chip {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 12px; padding: 6px 12px;
        background: var(--yellow); color: var(--yellow-ink);
        border-radius: 999px;
      }
      .id-head .dirty-chip .dot {
        width: 6px; height: 6px; border-radius: 50%; background: var(--yellow-ink);
      }

      .id-body {
        overflow-y: auto;
        padding: 28px;
        display: flex; flex-direction: column; gap: 24px;
      }

      .id-top {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        align-items: start;
      }

      .id-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: 20px;
        box-shadow: var(--shadow-1);
        display: flex; flex-direction: column; gap: 16px;
      }
      .id-card-head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
      }
      .id-card-head h4 {
        font-size: 11px; color: var(--ink-muted); font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
        margin: 0;
      }

      .id-field { display: flex; flex-direction: column; gap: 6px; }
      .id-field > label {
        font-size: 11px; font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted);
      }
      .id-inline-name {
        font-family: var(--font-sans);
        font-size: 22px; font-weight: 500;
        color: var(--violet-700);
        letter-spacing: -0.015em;
        background: transparent;
        border: 0;
        padding: 4px 6px;
        margin: -4px -6px;
        border-radius: 6px;
        transition: background 120ms ease, box-shadow 120ms ease;
        width: 100%;
      }
      .id-inline-name:hover { background: var(--violet-50); }
      .id-inline-name:focus {
        outline: none; background: var(--surface);
        box-shadow: var(--focus-ring);
      }
      .id-code-badge {
        display: inline-flex; align-items: center; gap: 6px;
        font-family: var(--font-mono);
        font-size: 12px; font-variant-numeric: tabular-nums;
        padding: 3px 10px;
        background: var(--violet-100); color: var(--violet-700);
        border-radius: 999px;
        cursor: default; user-select: text;
      }
      .id-code-badge .lock { width: 10px; height: 10px; opacity: 0.7; }

      .id-grid-2 {
        display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
      }
      .id-num-with-unit {
        display: flex; gap: 8px; align-items: stretch;
      }
      .id-num-with-unit .input { flex: 1; text-align: right; font-variant-numeric: tabular-nums; }
      .id-unit-pill {
        display: inline-flex; align-items: center;
        padding: 0 10px;
        font-size: 12px; color: var(--ink-muted);
        background: var(--page-bg);
        border: 1px solid var(--border-strong);
        border-radius: var(--r-md);
        min-width: 64px; justify-content: center;
        white-space: nowrap;
      }

      .id-toggle-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 0;
        gap: 12px;
        border-top: 1px solid var(--border);
      }
      .id-toggle-row .lbl { display: flex; flex-direction: column; gap: 2px; }
      .id-toggle-row .lbl .t { font-size: 13px; font-weight: 500; color: var(--ink); }
      .id-toggle-row .lbl .h { font-size: 12px; color: var(--ink-muted); }
      .id-switch {
        position: relative;
        width: 36px; height: 20px;
        border-radius: 999px;
        background: var(--border-strong);
        cursor: pointer;
        transition: background 120ms ease;
        flex-shrink: 0;
      }
      .id-switch::after {
        content: "";
        position: absolute; top: 2px; left: 2px;
        width: 16px; height: 16px;
        background: var(--surface);
        border-radius: 50%;
        transition: transform 140ms cubic-bezier(0.2,0.8,0.2,1);
        box-shadow: 0 1px 2px rgba(0,0,0,0.18);
      }
      .id-switch.on { background: var(--teal-500); }
      .id-switch.on::after { transform: translateX(16px); }

      .id-level-block {
        display: flex; flex-direction: column; gap: 10px;
        padding-top: 14px;
        border-top: 1px solid var(--border);
      }
      .id-level-block .row {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
      }
      .id-level-block .lbl {
        font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted); font-weight: 500;
      }
      .id-level-badge {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 13px; font-weight: 500;
        padding: 5px 12px; border-radius: 999px;
      }
      .id-level-badge .dot {
        width: 7px; height: 7px; border-radius: 50%; background: currentColor;
      }
      .id-level-bar {
        height: 8px; border-radius: 999px;
        background: var(--border);
        overflow: hidden;
        position: relative;
      }
      .id-level-bar > .fill {
        height: 100%; border-radius: 999px;
        transition: width 220ms cubic-bezier(0.2,0.8,0.2,1),
                    background 160ms ease;
      }
      .id-level-bar .min-marker {
        position: absolute; top: -3px; bottom: -3px; width: 1px;
        background: var(--border-strong);
      }
      .id-level-stats {
        display: flex; justify-content: space-between; align-items: baseline;
        font-size: 12px; color: var(--ink-muted);
      }
      .id-level-stats .strong { color: var(--ink); font-weight: 500; font-variant-numeric: tabular-nums; }

      /* Compra y costos */
      .id-cost-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 0;
        border-top: 1px solid var(--border);
        font-size: 13px;
      }
      .id-cost-row.grand {
        border-top: 1px solid var(--border-strong);
        margin-top: 6px;
        padding-top: 14px;
      }
      .id-cost-label {
        font-size: 12px; color: var(--ink-muted);
        text-transform: uppercase; letter-spacing: 0.06em;
      }
      .id-cost-input {
        width: 140px;
        font-family: var(--font-sans);
        font-size: 14px;
        font-variant-numeric: tabular-nums;
        text-align: right;
        padding: 8px 12px;
        border: 1px solid var(--border-strong);
        border-radius: var(--r-md);
        background: var(--surface);
        color: var(--ink);
      }
      .id-cost-input:focus {
        outline: none;
        border-color: var(--teal-500);
        box-shadow: var(--focus-ring);
      }
      .id-cost-input.readonly {
        background: var(--page-bg);
        color: var(--ink-muted);
        border-color: var(--border);
      }
      .id-cost-row.grand .id-cost-input {
        font-size: 18px; font-weight: 500;
        color: var(--violet-700); width: 160px;
      }
      .id-cost-fecha {
        font-family: var(--font-sans);
        font-size: 13px;
        color: var(--ink-muted);
        font-variant-numeric: tabular-nums;
      }

      /* Proveedores spreadsheet */
      .id-prov-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-1);
        padding: 20px;
        display: flex; flex-direction: column; gap: 14px;
      }
      .id-prov-card .head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
      }
      .id-prov-card .head h4 { font-size: 16px; color: var(--ink); font-weight: 500; }
      .id-prov-card .head .hint { font-size: 12px; color: var(--ink-muted); }

      .id-prov-table {
        border: 1px solid var(--border-strong);
        border-radius: 10px;
        background: var(--surface);
        overflow: hidden;
      }
      .id-prov-table table { width: 100%; border-collapse: collapse; }
      .id-prov-table thead th {
        text-align: left;
        padding: 10px 12px;
        font-size: 11px; font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted);
        background: var(--page-bg);
        border-bottom: 1px solid var(--border);
      }
      .id-prov-table thead th.num { text-align: right; }
      .id-prov-table thead th.center { text-align: center; }
      .id-prov-table tbody td {
        padding: 0;
        border-bottom: 1px solid var(--border);
      }
      .id-prov-table tbody tr:last-child td { border-bottom: 0; }
      .id-prov-table tbody td.center { text-align: center; padding: 8px; }
      .id-prov-table tbody td .grip { padding: 8px; color: var(--ink-muted); cursor: grab; }
      .id-prov-table tbody tr.dragging td { opacity: 0.5; }
      .id-prov-table tbody tr.drag-over td { box-shadow: inset 0 2px 0 0 var(--violet-700); }

      .id-prov-table .prov-input {
        width: 100%;
        border: 0; background: transparent;
        font-family: var(--font-sans); font-size: 13px;
        color: var(--ink);
        padding: 11px 12px;
        outline: none;
      }
      .id-prov-table .prov-input.num {
        text-align: right; font-variant-numeric: tabular-nums;
      }
      .id-prov-table .prov-input:focus { background: var(--teal-100); }

      .id-radio {
        width: 18px; height: 18px;
        border-radius: 50%;
        border: 1.5px solid var(--border-strong);
        background: var(--surface);
        cursor: pointer;
        display: inline-grid; place-items: center;
        position: relative;
        transition: border-color 120ms ease;
      }
      .id-radio:hover { border-color: var(--violet-700); }
      .id-radio.checked { border-color: var(--violet-700); }
      .id-radio.checked::after {
        content: "";
        width: 9px; height: 9px; border-radius: 50%;
        background: var(--violet-700);
      }

      .id-prov-del {
        background: transparent; border: 0;
        width: 28px; height: 28px;
        display: inline-grid; place-items: center;
        border-radius: 6px;
        color: var(--ink-muted); cursor: pointer;
        transition: background 120ms ease, color 120ms ease;
      }
      .id-prov-del:hover { color: var(--coral-500); background: var(--coral-50); }
      .id-prov-del svg { width: 14px; height: 14px; }

      .id-prov-add {
        align-self: flex-start;
        background: transparent;
        border: 1px dashed var(--border-strong);
        color: var(--violet-700);
        font-size: 12px; font-weight: 500;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex; align-items: center; gap: 6px;
        transition: background 120ms ease, border-color 120ms ease;
      }
      .id-prov-add:hover { background: var(--violet-50); border-color: var(--violet-700); }
      .id-prov-add:disabled {
        opacity: 0.5; pointer-events: none;
      }
      .id-prov-add svg { width: 14px; height: 14px; }

      /* Notas */
      .id-notes textarea {
        min-height: 110px;
        resize: vertical;
      }

      /* Action bar */
      .id-foot {
        display: flex; align-items: center; gap: 10px;
        padding: 14px 28px;
        background: var(--surface);
        border-top: 1px solid var(--border);
      }
      .id-foot .spacer { flex: 1; }
      .id-back-btn {
        font-family: var(--font-sans); font-size: 14px; font-weight: 500;
        padding: 9px 14px;
        border-radius: 8px;
        border: 1px solid transparent;
        cursor: pointer;
        display: inline-flex; align-items: center; gap: 8px;
        background: transparent; color: var(--violet-700);
        transition: background 120ms ease;
      }
      .id-back-btn:hover { background: var(--violet-50); }
      .id-back-btn svg { width: 16px; height: 16px; }

      /* Confirm sheet */
      .id-confirm-mask {
        position: absolute; inset: 0;
        background: rgba(28, 26, 30, 0.30);
        display: grid; place-items: center;
        z-index: 4;
        animation: id-mask-in 140ms ease both;
      }
      @keyframes id-mask-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .id-confirm {
        background: var(--surface);
        border-radius: var(--r-lg);
        padding: 22px;
        width: 380px;
        box-shadow: var(--shadow-2, 0 12px 32px rgba(28,26,30,0.18));
        display: flex; flex-direction: column; gap: 14px;
        border: 1px solid var(--border);
      }
      .id-confirm h4 { font-size: 17px; font-weight: 500; color: var(--ink); margin: 0; }
      .id-confirm p { font-size: 13px; color: var(--ink-muted); margin: 0; line-height: 1.45; }
      .id-confirm-actions {
        display: flex; gap: 8px; justify-content: flex-end;
      }
    `}</style>
  );
}

/* =========================================================
   Componente principal
   ========================================================= */
function InsumoDetalleScreen({ insumo, onBack, onSaved, onDeleted }) {
  const seed = insumo ||
    (typeof INSUMOS_RICH !== "undefined" && INSUMOS_RICH[0]) || {
      code: "I-0000", name: "Insumo", cat: "Varios", stock: 0, min: 0, unit: "u",
      costoPaquete: 0, cantidadPack: 1, proveedorPrincipal: "",
    };

  // ----- estado del formulario -----
  const [nombre, setNombre]               = useIState(seed.name);
  const [categoria, setCategoria]         = useIState(seed.cat);
  const [unidad, setUnidad]               = useIState(seed.unit);
  const [stockActual, setStockActual]     = useIState(seed.stock);
  const [stockMinimo, setStockMinimo]     = useIState(seed.min);
  const [activo, setActivo]               = useIState(seed.activo !== false);
  const [costoPaquete, setCostoPaquete]   = useIState(seed.costoPaquete ?? 0);
  const [cantidadPack, setCantidadPack]   = useIState(seed.cantidadPack ?? 1);
  const [fechaActualizacion, setFechaAct] = useIState(seed.fechaActualizacion || new Date("2026-05-23T10:42"));
  const [notas, setNotas]                 = useIState(seed.notas || "");

  const initialProveedores = useIMemo(() => {
    if (seed.proveedores && seed.proveedores.length) return seed.proveedores.map((p) => ({ ...p, id: newRowId() }));
    return [{ id: newRowId(), name: seed.proveedorPrincipal || "", precio: seed.costoPaquete || 0, principal: true }];
  }, [seed]);
  const [proveedores, setProveedores] = useIState(initialProveedores);

  const [confirmExit, setConfirmExit] = useIState(false);
  const [confirmDel,  setConfirmDel]  = useIState(false);
  const [closing,     setClosing]     = useIState(false);

  // ----- spreadsheet keyboard behavior for proveedores -----
  const [activeRow,   setActiveRow]   = useIState(null);
  const [dragId,      setDragId]      = useIState(null);
  const [dragOverId,  setDragOverId]  = useIState(null);
  const provTableRef = useIRef(null);

  // Snapshot inicial para detección de cambios
  const initialRef = useIRef({
    nombre: seed.name, categoria: seed.cat, unidad: seed.unit,
    stockActual: seed.stock, stockMinimo: seed.min,
    activo: seed.activo !== false,
    costoPaquete: seed.costoPaquete ?? 0, cantidadPack: seed.cantidadPack ?? 1,
    proveedores: JSON.stringify(initialProveedores.map(({ id, ...r }) => r)),
    notas: seed.notas || "",
  });

  /* ----- cálculos ----- */
  const costoUnitario = useIMemo(() => {
    const c = parseFloat(costoPaquete) || 0;
    const q = parseFloat(cantidadPack) || 0;
    return q > 0 ? c / q : 0;
  }, [costoPaquete, cantidadPack]);

  const nivel = useIMemo(() => computeNivel({ stock: stockActual, min: stockMinimo }), [stockActual, stockMinimo]);
  const nivelMeta = NIVEL_META[nivel];
  const fillPct = useIMemo(() => {
    const s = parseFloat(stockActual) || 0;
    const m = parseFloat(stockMinimo) || 0;
    if (m <= 0) return s > 0 ? 100 : 0;
    return Math.max(2, Math.min(100, (s / (m * 1.5)) * 100));
  }, [stockActual, stockMinimo]);
  const minMarkerPct = useIMemo(() => {
    const m = parseFloat(stockMinimo) || 0;
    return m <= 0 ? 0 : Math.min(100, 100 / 1.5);
  }, [stockMinimo]);

  /* ----- dirty ----- */
  const dirty = useIMemo(() => {
    const i = initialRef.current;
    return (
      nombre        !== i.nombre        ||
      categoria     !== i.categoria     ||
      unidad        !== i.unidad        ||
      Number(stockActual)  !== Number(i.stockActual)  ||
      Number(stockMinimo)  !== Number(i.stockMinimo)  ||
      activo        !== i.activo        ||
      Number(costoPaquete) !== Number(i.costoPaquete) ||
      Number(cantidadPack) !== Number(i.cantidadPack) ||
      notas         !== i.notas         ||
      JSON.stringify(proveedores.map(({ id, ...r }) => r)) !== i.proveedores
    );
  }, [nombre, categoria, unidad, stockActual, stockMinimo, activo,
      costoPaquete, cantidadPack, notas, proveedores]);

  /* =========================================================
     Proveedores helpers
     ========================================================= */
  const updateProv = (id, patch) =>
    setProveedores((ls) => ls.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removeProv = (id) =>
    setProveedores((ls) => {
      const next = ls.filter((p) => p.id !== id);
      if (next.length === 0) {
        return [{ id: newRowId(), name: "", precio: 0, principal: true }];
      }
      if (!next.some((p) => p.principal)) next[0].principal = true;
      return next;
    });
  const addProv = () =>
    setProveedores((ls) => {
      if (ls.length >= 3) return ls;
      return [...ls, { id: newRowId(), name: "", precio: 0, principal: false }];
    });
  const setPrincipal = (id) =>
    setProveedores((ls) => ls.map((p) => ({ ...p, principal: p.id === id })));

  /* Drag reorder */
  const onProvDrop = (id) => {
    if (dragId == null || dragId === id) { setDragId(null); setDragOverId(null); return; }
    setProveedores((ls) => {
      const from = ls.findIndex((p) => p.id === dragId);
      const to   = ls.findIndex((p) => p.id === id);
      if (from < 0 || to < 0) return ls;
      const next = ls.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null); setDragOverId(null);
  };

  /* =========================================================
     Navegación / acciones
     ========================================================= */
  const closeWithAnim = (cb) => {
    setClosing(true);
    setTimeout(() => { setClosing(false); cb && cb(); }, 200);
  };
  const handleBack = () => {
    if (dirty) { setConfirmExit(true); return; }
    closeWithAnim(onBack);
  };
  const handleSave = () => {
    if (!dirty) return;
    const now = new Date();
    setFechaAct(now);
    initialRef.current = {
      nombre, categoria, unidad,
      stockActual, stockMinimo, activo,
      costoPaquete, cantidadPack,
      proveedores: JSON.stringify(proveedores.map(({ id, ...r }) => r)),
      notas,
    };
    const principal = proveedores.find((p) => p.principal) || proveedores[0];
    onSaved && onSaved({
      code: seed.code,
      name: nombre,
      cat: categoria,
      unit: unidad,
      stock: parseFloat(stockActual) || 0,
      min:   parseFloat(stockMinimo) || 0,
      activo,
      costoPaquete: parseFloat(costoPaquete) || 0,
      cantidadPack: parseFloat(cantidadPack) || 0,
      costoUnitario,
      proveedorPrincipal: principal?.name || "",
      proveedores: proveedores.map(({ id, ...r }) => r),
      notas,
      fechaActualizacion: now,
    });
  };
  const handleDelete = () => {
    onDeleted && onDeleted(seed);
  };

  /* =========================================================
     Render
     ========================================================= */
  return (
    <div className={"id-overlay" + (closing ? " closing" : "")} data-screen-label="Detalle de insumo">
      <InsumoDetalleStyles />

      {/* HEAD */}
      <div className="id-head">
        <button className="icon-btn" onClick={handleBack} title="Volver a insumos">
          <I.back />
        </button>
        <div className="id-title">
          <span className="eyebrow">
            Insumo <span className="code">· {seed.code}</span>
          </span>
          <h2>{nombre || "Sin nombre"}</h2>
        </div>
        <div className="spacer" style={{ flex: 1 }} />
        {dirty && (
          <span className="dirty-chip" title="Cambios sin guardar">
            <span className="dot" /> Cambios sin guardar
          </span>
        )}
      </div>

      {/* BODY */}
      <div className="id-body">
        <div className="id-top">

          {/* ============ Columna 1: Identidad + Stock ============ */}
          <section className="id-card">
            <div className="id-card-head">
              <h4>Identidad &amp; stock</h4>
              <span className="id-code-badge" title="Código autogenerado, solo lectura">
                <LockIconI /> {seed.code}
              </span>
            </div>

            <div className="id-field">
              <label>Nombre</label>
              <input
                className="id-inline-name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del insumo"
              />
            </div>

            <div className="id-grid-2">
              <div className="id-field">
                <label>Categoría</label>
                <select
                  className="select"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  {INSUMO_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="id-field">
                <label>Unidad de medida</label>
                <input
                  className="input"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  placeholder="Ej. pliego, m, rollo…"
                />
              </div>
            </div>

            <div className="id-grid-2">
              <div className="id-field">
                <label>Stock actual</label>
                <div className="id-num-with-unit">
                  <input
                    className="input"
                    type="number" min="0" step="1"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                  />
                  <span className="id-unit-pill">{unidad || "u"}</span>
                </div>
              </div>
              <div className="id-field">
                <label>Stock mínimo</label>
                <div className="id-num-with-unit">
                  <input
                    className="input"
                    type="number" min="0" step="1"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                  />
                  <span className="id-unit-pill">{unidad || "u"}</span>
                </div>
              </div>
            </div>

            <div className="id-toggle-row">
              <div className="lbl">
                <span className="t">Insumo activo</span>
                <span className="h">Visible en autocompletados y reportes.</span>
              </div>
              <div
                role="switch"
                aria-checked={activo}
                tabIndex={0}
                className={"id-switch" + (activo ? " on" : "")}
                onClick={() => setActivo((v) => !v)}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setActivo((v) => !v); } }}
              />
            </div>

            <div className="id-level-block">
              <div className="row">
                <span className="lbl">Nivel</span>
                <span
                  className="id-level-badge"
                  style={{ background: nivelMeta.bg, color: nivelMeta.color }}
                >
                  <span className="dot" /> {nivelMeta.label}
                </span>
              </div>
              <div className="id-level-bar">
                <div
                  className="fill"
                  style={{ width: fillPct + "%", background: nivelMeta.color }}
                />
                {parseFloat(stockMinimo) > 0 && (
                  <div className="min-marker" style={{ left: minMarkerPct + "%" }} />
                )}
              </div>
              <div className="id-level-stats">
                <span><span className="strong">{stockActual || 0}</span> de mínimo <span className="strong">{stockMinimo || 0}</span> {unidad}</span>
                <span>
                  {parseFloat(stockMinimo) > 0
                    ? Math.round(((parseFloat(stockActual) || 0) / parseFloat(stockMinimo)) * 100) + "% del mínimo"
                    : "sin mínimo configurado"}
                </span>
              </div>
            </div>
          </section>

          {/* ============ Columna 2: Compra y costos ============ */}
          <section className="id-card">
            <div className="id-card-head">
              <h4>Compra &amp; costos</h4>
            </div>

            <div className="id-grid-2">
              <div className="id-field">
                <label>Costo del paquete</label>
                <input
                  className="input"
                  type="number" min="0" step="0.01"
                  value={costoPaquete}
                  onChange={(e) => setCostoPaquete(e.target.value)}
                  style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                />
              </div>
              <div className="id-field">
                <label>Cantidad por pack</label>
                <div className="id-num-with-unit">
                  <input
                    className="input"
                    type="number" min="0" step="0.01"
                    value={cantidadPack}
                    onChange={(e) => setCantidadPack(e.target.value)}
                    style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                  />
                  <span className="id-unit-pill">{unidad || "u"}</span>
                </div>
              </div>
            </div>

            <div className="id-cost-row grand">
              <span className="id-cost-label">Costo unitario</span>
              <input
                className="id-cost-input readonly"
                value={moneyI(costoUnitario)}
                readOnly
                tabIndex={-1}
                title="Calculado: costo paquete ÷ cantidad por pack"
              />
            </div>

            <div className="id-cost-row">
              <span className="id-cost-label">Última actualización</span>
              <span className="id-cost-fecha">{fmtDate(fechaActualizacion)}</span>
            </div>

            <div className="id-cost-row" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="id-cost-label">Costo de referencia / unidad</span>
              <span className="id-cost-fecha" style={{ color: "var(--ink)", fontWeight: 500 }}>
                {moneyI(costoUnitario)} <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}>/ {unidad}</span>
              </span>
            </div>
          </section>
        </div>

        {/* ============ Proveedores ============ */}
        <section className="id-prov-card">
          <div className="head">
            <h4>Proveedores</h4>
            <span className="hint">Hasta 3 · marcá uno como principal</span>
          </div>

          <div
            ref={provTableRef}
            tabIndex={-1}
            className="id-prov-table"
          >
            <table>
              <colgroup>
                <col style={{ width: 28 }} />
                <col />
                <col style={{ width: 170 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 44 }} />
              </colgroup>
              <thead>
                <tr>
                  <th></th>
                  <th>Proveedor</th>
                  <th className="num">Precio referencia</th>
                  <th className="center">Principal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((p) => (
                  <tr
                    key={p.id}
                    className={[
                      activeRow === p.id && "active",
                      dragId === p.id && "dragging",
                      dragOverId === p.id && dragId !== p.id && "drag-over",
                    ].filter(Boolean).join(" ")}
                    draggable
                    onDragStart={() => setDragId(p.id)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverId(p.id); }}
                    onDrop={() => onProvDrop(p.id)}
                    onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                  >
                    <td className="center">
                      <span className="grip" title="Arrastrar para reordenar"><I.grip /></span>
                    </td>
                    <td>
                      <input
                        className="prov-input"
                        list="id-prov-options"
                        value={p.name}
                        placeholder="Buscar proveedor…"
                        onChange={(e) => updateProv(p.id, { name: e.target.value })}
                        onFocus={() => setActiveRow(p.id)}
                      />
                    </td>
                    <td>
                      <input
                        className="prov-input num"
                        type="number" min="0" step="0.01"
                        value={p.precio}
                        onChange={(e) => updateProv(p.id, { precio: e.target.value })}
                        onFocus={() => setActiveRow(p.id)}
                      />
                    </td>
                    <td className="center">
                      <button
                        type="button"
                        className={"id-radio" + (p.principal ? " checked" : "")}
                        aria-checked={p.principal}
                        role="radio"
                        onClick={() => setPrincipal(p.id)}
                        title={p.principal ? "Proveedor principal" : "Marcar como principal"}
                      />
                    </td>
                    <td>
                      <button
                        className="id-prov-del"
                        onClick={() => removeProv(p.id)}
                        title="Eliminar proveedor"
                      ><I.trash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <datalist id="id-prov-options">
              {PROVEEDORES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <button
            className="id-prov-add"
            onClick={addProv}
            disabled={proveedores.length >= 3}
          >
            <I.plus /> Agregar proveedor {proveedores.length >= 3 && "· máx 3"}
          </button>
        </section>

        {/* ============ Notas ============ */}
        <section className="id-prov-card id-notes">
          <div className="head">
            <h4>Notas</h4>
            <span className="hint">Información interna · solo visible para tu equipo</span>
          </div>
          <textarea
            className="textarea"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Anotá variaciones de proveedor, tiempos de entrega, observaciones de calidad…"
          />
        </section>
      </div>

      {/* FOOT */}
      <div className="id-foot">
        <button className="id-back-btn" onClick={handleBack}>
          <I.back /> Volver a insumos
        </button>
        <div className="spacer" />
        <button
          className="btn btn-danger"
          onClick={() => setConfirmDel(true)}
        ><I.trash /> Eliminar insumo</button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!dirty}
          style={{ opacity: dirty ? 1 : 0.5, pointerEvents: dirty ? "auto" : "none" }}
        ><I.check /> Guardar cambios</button>
      </div>

      {/* Confirm: salir sin guardar */}
      {confirmExit && (
        <div className="id-confirm-mask" onClick={() => setConfirmExit(false)}>
          <div className="id-confirm" onClick={(e) => e.stopPropagation()}>
            <h4>¿Salir sin guardar?</h4>
            <p>Tenés cambios pendientes en <strong>{seed.code}</strong>. Si salís ahora, vas a perderlos.</p>
            <div className="id-confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmExit(false)}>Seguir editando</button>
              <button
                className="btn btn-danger"
                onClick={() => { setConfirmExit(false); closeWithAnim(onBack); }}
              >Salir sin guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm: eliminar */}
      {confirmDel && (
        <div className="id-confirm-mask" onClick={() => setConfirmDel(false)}>
          <div className="id-confirm" onClick={(e) => e.stopPropagation()}>
            <h4>Eliminar insumo</h4>
            <p>Vas a eliminar <strong>{seed.code} · {nombre}</strong>. Esta acción no se puede deshacer.</p>
            <div className="id-confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button
                className="btn btn-danger"
                onClick={() => { setConfirmDel(false); handleDelete(); }}
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Iconos auxiliares */
function LockIconI() {
  return (
    <svg
      className="lock"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

Object.assign(window, {
  InsumoDetalleScreen,
  INSUMO_CATEGORIES,
  PROVEEDORES,
  INSUMOS_RICH,
  computeNivel,
  NIVEL_META,
});
