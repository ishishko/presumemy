/* global React, I, INSUMOS, PRODUCTOS_LIST, PRODUCTOS_CATEGORIES, moneyProductos */
// Pantalla "Detalle de producto" — full-content takeover (sidebar opaco visible).
// Auto-contenida: incluye su propio <style> con los selectores específicos.
// Expone ProductoDetalleScreen al window para que la pueda montar cualquier host.

const { useState: useDState, useMemo: useDMemo, useEffect: useDEffect, useRef: useDRef } =
  React;

/* =========================================================
   Helpers
   ========================================================= */
const moneyD = (n) =>
  "$ " +
  Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const newId = (() => {
  let i = 0;
  return () => ++i;
})();

// Fallback de categorías por si productos.jsx no se carga antes.
const PD_CATEGORIES =
  (typeof PRODUCTOS_CATEGORIES !== "undefined" && PRODUCTOS_CATEGORIES) || [
    "Box", "Golosinas", "Letras", "PaperCraft",
    "Banner", "Box 3D", "Aplique", "Tag", "Varios",
  ];

const PD_INSUMOS_FALLBACK = [
  { name: "Cinta dorada 5 m",        unit: "rollo",  cost: 35  },
  { name: "Papel kraft 70 g",        unit: "pliego", cost: 18  },
  { name: "Listón satín 1 cm",       unit: "m",      cost: 8   },
  { name: "Tinta dorada",            unit: "bote",   cost: 120 },
  { name: "Etiqueta circular 3 cm",  unit: "u",      cost: 1.5 },
  { name: "Pegamento blanco 250 ml", unit: "bote",   cost: 65  },
  { name: "Cartulina opalina",       unit: "pliego", cost: 22  },
  { name: "Vinilo adhesivo",         unit: "m",      cost: 30  },
];
const PD_INSUMOS =
  (typeof INSUMOS !== "undefined" && INSUMOS.length ? INSUMOS : PD_INSUMOS_FALLBACK);

const BOM_TIPOS = [
  { id: "insumo",   label: "Insumo"   },
  { id: "cameo",    label: "Cameo"    },
  { id: "embalaje", label: "Embalaje" },
  { id: "extra",    label: "Extra"    },
];

/* =========================================================
   Estilos específicos de la pantalla (auto-inyectados)
   ========================================================= */
function ProductoDetalleStyles() {
  return (
    <style>{`
      /* ----- Layout takeover ----- */
      .pd-overlay {
        position: fixed;
        top: 0; right: 0; bottom: 0; left: 240px;
        z-index: 30;
        background: var(--page-bg);
        display: grid;
        grid-template-rows: auto 1fr auto;
        min-height: 0;
        animation: pd-fade-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        overflow: hidden;
      }
      @keyframes pd-fade-in {
        from { transform: translateY(6px); opacity: 0.6; }
        to   { transform: translateY(0); opacity: 1; }
      }

      .pd-head {
        display: flex; align-items: center; gap: 14px;
        padding: 18px 28px;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
      }
      .pd-head .pd-title { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
      .pd-head .pd-title .eyebrow {
        font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
        color: var(--ink-muted); font-weight: 500;
        display: flex; align-items: center; gap: 8px;
      }
      .pd-head .pd-title .eyebrow .code {
        color: var(--violet-700); font-variant-numeric: tabular-nums;
        font-family: var(--font-mono);
      }
      .pd-head .pd-title h2 { font-size: 22px; line-height: 1.1; margin: 0; }
      .pd-head .dirty-chip {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 12px; padding: 6px 12px;
        background: var(--yellow); color: var(--yellow-ink);
        border-radius: 999px;
      }
      .pd-head .dirty-chip .dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--yellow-ink);
      }

      .pd-body {
        overflow-y: auto;
        padding: 28px;
        display: flex; flex-direction: column; gap: 24px;
      }

      /* ----- Top three columns ----- */
      .pd-top {
        display: grid;
        grid-template-columns: 320px 1fr 360px;
        gap: 20px;
        align-items: start;
      }

      .pd-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: 20px;
        box-shadow: var(--shadow-1);
        display: flex; flex-direction: column; gap: 16px;
      }
      .pd-card-head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
      }
      .pd-card-head h4 {
        font-size: 14px; color: var(--ink); font-weight: 500;
        letter-spacing: -0.005em; text-transform: uppercase;
        letter-spacing: 0.06em; font-size: 11px; color: var(--ink-muted);
      }

      /* ----- Photos ----- */
      .pd-photo-main {
        aspect-ratio: 4 / 3;
        width: 100%;
        background: #F0EEF4;
        border-radius: var(--r-md);
        display: grid; place-items: center;
        position: relative;
        color: rgba(28,26,30,0.30);
        overflow: hidden;
      }
      .pd-photo-main img,
      .pd-photo-thumb img {
        width: 100%; height: 100%; object-fit: cover; display: block;
      }
      .pd-photo-main > svg { width: 40px; height: 40px; }
      .pd-photo-thumbs {
        display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
      }
      .pd-photo-thumb {
        aspect-ratio: 4 / 3;
        background: #F0EEF4;
        border-radius: var(--r-md);
        display: grid; place-items: center;
        position: relative;
        cursor: pointer;
        color: rgba(28,26,30,0.30);
        transition: outline-color 120ms ease;
        outline: 1px solid transparent;
        overflow: hidden;
      }
      .pd-photo-thumb:hover { outline-color: var(--border-strong); }
      .pd-photo-thumb > svg { width: 22px; height: 22px; }
      .pd-photo-thumb.empty { cursor: default; }

      .pd-photo-remove {
        position: absolute; top: 6px; right: 6px;
        width: 22px; height: 22px;
        border: 0; border-radius: 999px;
        background: rgba(28, 26, 30, 0.55);
        color: #fff;
        cursor: pointer;
        display: grid; place-items: center;
        opacity: 0; transition: opacity 120ms ease, background 120ms ease;
      }
      .pd-photo-main:hover .pd-photo-remove,
      .pd-photo-thumb:hover .pd-photo-remove { opacity: 1; }
      .pd-photo-remove:hover { background: var(--coral-500); }
      .pd-photo-remove svg { width: 12px; height: 12px; }

      .pd-drop {
        border: 1px dashed var(--border-strong);
        border-radius: var(--r-md);
        padding: 14px;
        text-align: center;
        font-size: 12px; color: var(--ink-muted);
        background: var(--page-bg);
        cursor: pointer;
        transition: border-color 120ms ease, background 120ms ease, color 120ms ease;
        display: flex; flex-direction: column; gap: 4px; align-items: center;
      }
      .pd-drop:hover, .pd-drop.over {
        border-color: var(--teal-500); background: var(--teal-50); color: var(--ink);
      }
      .pd-drop strong { color: var(--violet-700); font-weight: 500; }
      .pd-drop svg { width: 18px; height: 18px; color: var(--violet-700); }
      .pd-drop.disabled {
        opacity: 0.5; cursor: not-allowed;
      }

      /* ----- Identity ----- */
      .pd-field { display: flex; flex-direction: column; gap: 6px; }
      .pd-field > label {
        font-size: 11px; font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted);
      }
      .pd-inline-name {
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
      .pd-inline-name:hover { background: var(--violet-50); }
      .pd-inline-name:focus {
        outline: none;
        background: var(--surface);
        box-shadow: var(--focus-ring);
      }
      .pd-code-badge {
        display: inline-flex; align-items: center; gap: 6px;
        font-family: var(--font-mono);
        font-size: 12px; font-variant-numeric: tabular-nums;
        padding: 3px 10px;
        background: var(--violet-100); color: var(--violet-700);
        border-radius: 999px;
        cursor: default; user-select: text;
      }
      .pd-code-badge .lock { width: 10px; height: 10px; opacity: 0.7; }

      .pd-id-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
      }

      .pd-toggle-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 0;
        gap: 12px;
        border-top: 1px solid var(--border);
      }
      .pd-toggle-row .lbl { display: flex; flex-direction: column; gap: 2px; }
      .pd-toggle-row .lbl .t { font-size: 13px; font-weight: 500; color: var(--ink); }
      .pd-toggle-row .lbl .h { font-size: 12px; color: var(--ink-muted); }
      .pd-switch {
        position: relative;
        width: 36px; height: 20px;
        border-radius: 999px;
        background: var(--border-strong);
        cursor: pointer;
        transition: background 120ms ease;
        flex-shrink: 0;
      }
      .pd-switch::after {
        content: "";
        position: absolute; top: 2px; left: 2px;
        width: 16px; height: 16px;
        background: var(--surface);
        border-radius: 50%;
        transition: transform 140ms cubic-bezier(0.2,0.8,0.2,1);
        box-shadow: 0 1px 2px rgba(0,0,0,0.18);
      }
      .pd-switch.on { background: var(--teal-500); }
      .pd-switch.on::after { transform: translateX(16px); }

      .pd-validation {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
        padding: 10px 0 0;
        border-top: 1px solid var(--border);
      }
      .pd-validation .vlbl {
        font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted); font-weight: 500;
      }
      .pd-val-badge {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 12px; font-weight: 500;
        padding: 4px 10px; border-radius: 999px;
      }
      .pd-val-badge .vdot {
        width: 6px; height: 6px; border-radius: 50%;
        background: currentColor;
      }
      .pd-val-ok    { background: #D0EADD; color: #1F5A3E; }
      .pd-val-err   { background: var(--coral-50); color: var(--coral-500); }
      .pd-val-warn  { background: var(--yellow); color: var(--yellow-ink); }

      /* ----- Prices ----- */
      .pd-price-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      }
      .pd-price-grid .pd-field-wide { grid-column: 1 / -1; }
      .pd-price-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 0;
        border-top: 1px solid var(--border);
        font-size: 13px;
      }
      .pd-price-row.grand {
        border-top: 1px solid var(--border-strong);
        margin-top: 6px;
        padding-top: 14px;
      }
      .pd-price-row.grand .pd-price-label {
        font-size: 14px; font-weight: 500; color: var(--ink);
      }
      .pd-price-row.grand .pd-price-value {
        font-size: 22px; font-weight: 500; color: var(--violet-700);
        letter-spacing: -0.01em;
      }
      .pd-price-label {
        font-size: 12px; color: var(--ink-muted);
        text-transform: uppercase; letter-spacing: 0.06em;
      }
      .pd-money-input {
        width: 130px;
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
      .pd-money-input:focus {
        outline: none;
        border-color: var(--teal-500);
        box-shadow: var(--focus-ring);
      }
      .pd-money-input.readonly {
        background: var(--page-bg);
        color: var(--ink-muted);
        border-color: var(--border);
      }
      .pd-price-value {
        font-variant-numeric: tabular-nums;
        font-weight: 500;
        color: var(--ink);
      }

      /* ----- BOM ----- */
      .pd-bom {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-1);
        padding: 20px;
        display: flex; flex-direction: column; gap: 14px;
      }
      .pd-bom .pd-bom-head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
      }
      .pd-bom .pd-bom-head h4 { font-size: 16px; color: var(--ink); font-weight: 500; }
      .pd-bom-table {
        border: 1px solid var(--border-strong);
        border-radius: 10px;
        background: var(--surface);
        overflow: hidden;
      }
      .pd-bom-table .cell-select {
        width: 100%;
        border: 0; background: transparent;
        font-family: var(--font-sans); font-size: 13px;
        color: var(--ink);
        padding: 11px 8px;
        outline: none;
        cursor: pointer;
      }
      .pd-bom-table .cell-select:focus { background: var(--teal-100); }

      .pd-bom-total {
        display: flex; justify-content: flex-end; align-items: baseline;
        gap: 16px;
        padding-top: 8px;
      }
      .pd-bom-total .lbl { font-size: 12px; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.06em; }
      .pd-bom-total .val {
        font-size: 18px; font-weight: 500; color: var(--violet-700);
        font-variant-numeric: tabular-nums; letter-spacing: -0.01em;
      }

      /* ----- Action bar ----- */
      .pd-foot {
        display: flex; align-items: center; gap: 10px;
        padding: 14px 28px;
        background: var(--surface);
        border-top: 1px solid var(--border);
      }
      .pd-foot .spacer { flex: 1; }

      .pd-back-btn {
        font-family: var(--font-sans); font-size: 14px; font-weight: 500;
        padding: 9px 14px;
        border-radius: 8px;
        border: 1px solid transparent;
        cursor: pointer;
        display: inline-flex; align-items: center; gap: 8px;
        background: transparent; color: var(--violet-700);
        transition: background 120ms ease;
      }
      .pd-back-btn:hover { background: var(--violet-50); }
      .pd-back-btn svg { width: 16px; height: 16px; }
    `}</style>
  );
}

/* =========================================================
   Componente principal
   ========================================================= */
function ProductoDetalleScreen({ product, onBack, onDeleted, onSaved }) {
  // Producto fuente (puede llegar de afuera o tomamos uno de demo)
  const seed = product ||
    (typeof PRODUCTOS_LIST !== "undefined" && PRODUCTOS_LIST[2]) || {
      code: 1003, name: "Box temática unicornio", cat: "Box",
      medida: "18×18 cm", stock: 6, precioFinal: 240, precioAmb: 195,
    };

  // ----- estado del formulario -----
  const [nombre, setNombre]               = useDState(seed.name);
  const [categoria, setCategoria]         = useDState(seed.cat);
  const [medida, setMedida]               = useDState(seed.medida);
  const [descripcion, setDescripcion]     = useDState(seed.descripcion || "");
  const [activo, setActivo]               = useDState(seed.activo !== false);
  const [tieneBom, setTieneBom]           = useDState(!!seed.tieneBom);

  const [tipoGanancia, setTipoGanancia]   = useDState(seed.tipoGanancia || "porcentaje"); // porcentaje | monto
  const [valorGanancia, setValorGanancia] = useDState(seed.valorGanancia ?? 80);
  const [costoManual, setCostoManual]     = useDState(seed.costoManual ?? Math.round(seed.precioFinal * 0.55));
  const [precioFinal, setPrecioFinal]     = useDState(seed.precioFinal);
  const [precioAmb, setPrecioAmb]         = useDState(seed.precioAmb);

  const [photos, setPhotos]               = useDState([]); // máximo 3 — vacío = placeholders
  const [dropOver, setDropOver]           = useDState(false);

  const initialBom = (seed.bom && seed.bom.length)
    ? seed.bom
    : [
        { id: newId(), tipo: "insumo",   item: "Cartulina opalina",    qty: 1,   unitCost: 22, },
        { id: newId(), tipo: "insumo",   item: "Cinta dorada 5 m",     qty: 0.4, unitCost: 35, },
        { id: newId(), tipo: "embalaje", item: "Bolsa kraft con visor", qty: 1,   unitCost: 8,  },
      ];
  const [bom, setBom]             = useDState(initialBom);
  const [activeRow, setActiveRow] = useDState(null);
  const [editing, setEditing]     = useDState(false);
  const [dragId, setDragId]       = useDState(null);
  const [dragOverId, setDragOverId] = useDState(null);
  const bomTableRef = useDRef(null);

  // Snapshot para detectar cambios sin guardar
  const initialRef = useDRef({
    nombre: seed.name, categoria: seed.cat, medida: seed.medida,
    descripcion: seed.descripcion || "",
    activo: seed.activo !== false, tieneBom: !!seed.tieneBom,
    tipoGanancia: seed.tipoGanancia || "porcentaje",
    valorGanancia: seed.valorGanancia ?? 80,
    costoManual: seed.costoManual ?? Math.round(seed.precioFinal * 0.55),
    precioFinal: seed.precioFinal, precioAmb: seed.precioAmb,
    bom: JSON.stringify(initialBom), photos: 0,
  });

  /* ----- cálculos ----- */
  const bomTotal = useDMemo(
    () => bom.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.unitCost) || 0), 0),
    [bom]
  );
  const costoProducto = tieneBom ? bomTotal : (parseFloat(costoManual) || 0);
  const precioCalculado = useDMemo(() => {
    const v = parseFloat(valorGanancia) || 0;
    if (tipoGanancia === "porcentaje") return costoProducto * (1 + v / 100);
    return costoProducto + v;
  }, [costoProducto, valorGanancia, tipoGanancia]);

  /* ----- dirty ----- */
  const dirty = useDMemo(() => {
    const i = initialRef.current;
    return (
      nombre        !== i.nombre        ||
      categoria     !== i.categoria     ||
      medida        !== i.medida        ||
      descripcion   !== i.descripcion   ||
      activo        !== i.activo        ||
      tieneBom      !== i.tieneBom      ||
      tipoGanancia  !== i.tipoGanancia  ||
      Number(valorGanancia) !== Number(i.valorGanancia) ||
      Number(costoManual)   !== Number(i.costoManual)   ||
      Number(precioFinal)   !== Number(i.precioFinal)   ||
      Number(precioAmb)     !== Number(i.precioAmb)     ||
      photos.length !== i.photos ||
      JSON.stringify(bom) !== i.bom
    );
  }, [nombre, categoria, medida, descripcion, activo, tieneBom,
      tipoGanancia, valorGanancia, costoManual, precioFinal, precioAmb,
      photos, bom]);

  /* ----- validación ----- */
  const validation = useDMemo(() => {
    if (!nombre.trim() || !categoria || !medida.trim()) {
      return { kind: "err", label: "Error" };
    }
    if (tieneBom && bom.filter(l => l.item && parseFloat(l.qty) > 0).length === 0) {
      return { kind: "err", label: "Error" };
    }
    if (!parseFloat(precioFinal) || parseFloat(precioFinal) <= 0) {
      return { kind: "warn", label: "Sin precio" };
    }
    return { kind: "ok", label: "OK" };
  }, [nombre, categoria, medida, tieneBom, bom, precioFinal]);

  /* =========================================================
     Photos
     ========================================================= */
  const addPhoto = (url) => {
    setPhotos((arr) => {
      if (arr.length >= 3) return arr;
      return [...arr, { id: newId(), url }];
    });
  };
  const removePhoto = (id) =>
    setPhotos((arr) => arr.filter((p) => p.id !== id));
  const promoteToMain = (id) =>
    setPhotos((arr) => {
      const idx = arr.findIndex((p) => p.id === id);
      if (idx <= 0) return arr;
      const next = arr.slice();
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  const onDropFiles = (e) => {
    e.preventDefault();
    setDropOver(false);
    if (photos.length >= 3) return;
    const files = Array.from(e.dataTransfer?.files || []);
    files.slice(0, 3 - photos.length).forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      const url = URL.createObjectURL(f);
      addPhoto(url);
    });
  };

  const main = photos[0];
  const thumb1 = photos[1];
  const thumb2 = photos[2];

  /* =========================================================
     BOM — mirror del patrón del editor de presupuestos
     ========================================================= */
  const updateBomLine = (id, patch) =>
    setBom((ls) => {
      const next = ls.map((l) => (l.id === id ? { ...l, ...patch } : l));
      if (editing) {
        const last = next[next.length - 1];
        const empty = !last.item && !last.qty && !last.unitCost;
        if (!empty)
          next.push({ id: newId(), tipo: "insumo", item: "", qty: "", unitCost: "" });
      }
      return next;
    });
  const removeBomLine = (id) =>
    setBom((ls) => {
      const next = ls.filter((l) => l.id !== id);
      return next.length
        ? next
        : [{ id: newId(), tipo: "insumo", item: "", qty: "", unitCost: "" }];
    });
  const handleBomItem = (id, val) => {
    const ins = PD_INSUMOS.find((i) => i.name === val);
    const patch = { item: val };
    if (ins) patch.unitCost = ins.cost ?? ins.unitCost ?? patch.unitCost;
    updateBomLine(id, patch);
  };
  const onBomTableFocus = () => {
    if (!editing) {
      setEditing(true);
      setBom((ls) => {
        const last = ls[ls.length - 1];
        const empty = !last.item && !last.qty && !last.unitCost;
        return empty
          ? ls
          : [...ls, { id: newId(), tipo: "insumo", item: "", qty: "", unitCost: "" }];
      });
    }
  };
  const onBomTableBlur = (e) => {
    if (bomTableRef.current && e.relatedTarget && bomTableRef.current.contains(e.relatedTarget))
      return;
    setEditing(false);
    setActiveRow(null);
    setBom((ls) => {
      if (ls.length <= 1) return ls;
      const last = ls[ls.length - 1];
      const empty = !last.item && !last.qty && !last.unitCost;
      return empty ? ls.slice(0, -1) : ls;
    });
  };
  const onBomDrop = (id) => {
    if (dragId == null || dragId === id) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    setBom((ls) => {
      const from = ls.findIndex((l) => l.id === dragId);
      const to = ls.findIndex((l) => l.id === id);
      if (from < 0 || to < 0) return ls;
      const next = ls.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
    setDragOverId(null);
  };

  /* =========================================================
     Actions
     ========================================================= */
  const handleSave = () => {
    if (!dirty) return;
    initialRef.current = {
      nombre, categoria, medida, descripcion, activo, tieneBom,
      tipoGanancia, valorGanancia, costoManual, precioFinal, precioAmb,
      bom: JSON.stringify(bom), photos: photos.length,
    };
    onSaved && onSaved({
      code: seed.code, nombre, categoria, medida, descripcion,
      activo, tieneBom, tipoGanancia, valorGanancia, costoManual,
      precioFinal, precioAmb, bom, photos: photos.length,
    });
  };

  /* =========================================================
     Render
     ========================================================= */
  return (
    <div className="pd-overlay" data-screen-label="Detalle de producto">
      <ProductoDetalleStyles />

      {/* HEAD */}
      <div className="pd-head">
        <button
          className="icon-btn"
          onClick={onBack}
          title="Volver al catálogo"
        >
          <I.back />
        </button>
        <div className="pd-title">
          <span className="eyebrow">
            Producto <span className="code">· {seed.code}</span>
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
      <div className="pd-body">
        <div className="pd-top">
          {/* =========== Columna 1: Fotos =========== */}
          <section className="pd-card">
            <div className="pd-card-head">
              <h4>Fotos</h4>
              <span className="text-hint" style={{ fontSize: 11 }}>
                {photos.length}/3
              </span>
            </div>

            <div className="pd-photo-main">
              {main ? (
                <>
                  <img src={main.url} alt="" />
                  <button
                    className="pd-photo-remove"
                    onClick={() => removePhoto(main.id)}
                    title="Eliminar foto"
                  >
                    <I.close />
                  </button>
                </>
              ) : (
                <ImgIcon />
              )}
            </div>

            <div className="pd-photo-thumbs">
              {[thumb1, thumb2].map((t, i) =>
                t ? (
                  <div
                    key={t.id}
                    className="pd-photo-thumb"
                    onClick={() => promoteToMain(t.id)}
                    title="Promover a foto principal"
                  >
                    <img src={t.url} alt="" />
                    <button
                      className="pd-photo-remove"
                      onClick={(e) => { e.stopPropagation(); removePhoto(t.id); }}
                      title="Eliminar foto"
                    >
                      <I.close />
                    </button>
                  </div>
                ) : (
                  <div key={"empty-" + i} className="pd-photo-thumb empty">
                    <ImgIcon />
                  </div>
                )
              )}
            </div>

            <label
              className={
                "pd-drop" +
                (dropOver ? " over" : "") +
                (photos.length >= 3 ? " disabled" : "")
              }
              onDragOver={(e) => { e.preventDefault(); if (photos.length < 3) setDropOver(true); }}
              onDragLeave={() => setDropOver(false)}
              onDrop={onDropFiles}
            >
              <I.download />
              <span>
                {photos.length >= 3
                  ? "Máximo 3 imágenes alcanzado"
                  : <>Arrastrá imágenes acá o <strong>subí desde tu equipo</strong></>}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={photos.length >= 3}
                onChange={(e) => {
                  Array.from(e.target.files || [])
                    .slice(0, 3 - photos.length)
                    .forEach((f) => {
                      if (!f.type.startsWith("image/")) return;
                      addPhoto(URL.createObjectURL(f));
                    });
                  e.target.value = "";
                }}
              />
            </label>
          </section>

          {/* =========== Columna 2: Identidad =========== */}
          <section className="pd-card">
            <div className="pd-card-head">
              <h4>Identidad</h4>
              <span className="pd-code-badge" title="Código autogenerado, solo lectura">
                <LockIcon /> {seed.code}
              </span>
            </div>

            <div className="pd-field">
              <label>Nombre</label>
              <input
                className="pd-inline-name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del producto"
              />
            </div>

            <div className="pd-id-grid">
              <div className="pd-field">
                <label>Categoría</label>
                <select
                  className="select"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  {PD_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="pd-field">
                <label>Medida</label>
                <input
                  className="input"
                  value={medida}
                  onChange={(e) => setMedida(e.target.value)}
                  placeholder="Ej. 15×15 cm"
                />
              </div>
            </div>

            <div className="pd-field">
              <label>Descripción</label>
              <textarea
                className="textarea"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles, terminaciones, materiales destacados…"
              />
            </div>

            <div className="pd-toggle-row">
              <div className="lbl">
                <span className="t">Producto activo</span>
                <span className="h">Visible en el catálogo y en presupuestos</span>
              </div>
              <div
                role="switch"
                aria-checked={activo}
                tabIndex={0}
                className={"pd-switch" + (activo ? " on" : "")}
                onClick={() => setActivo((v) => !v)}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setActivo((v) => !v); } }}
              />
            </div>
            <div className="pd-toggle-row">
              <div className="lbl">
                <span className="t">{tieneBom ? "Costo por receta" : "Costo manual"}</span>
                <span className="h">
                  {tieneBom
                    ? "El costo se calcula desde el BOM de insumos."
                    : "Ingresá el costo directamente, sin desglose."}
                </span>
              </div>
              <div
                role="switch"
                aria-checked={tieneBom}
                tabIndex={0}
                className={"pd-switch" + (tieneBom ? " on" : "")}
                onClick={() => setTieneBom((v) => !v)}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setTieneBom((v) => !v); } }}
              />
            </div>

            <div className="pd-validation">
              <span className="vlbl">Validación</span>
              <span
                className={
                  "pd-val-badge " +
                  (validation.kind === "ok"
                    ? "pd-val-ok"
                    : validation.kind === "warn"
                    ? "pd-val-warn"
                    : "pd-val-err")
                }
              >
                <span className="vdot" /> {validation.label}
              </span>
            </div>
          </section>

          {/* =========== Columna 3: Precios =========== */}
          <section className="pd-card">
            <div className="pd-card-head">
              <h4>Precios</h4>
            </div>

            <div className="pd-price-grid">
              <div className="pd-field pd-field-wide">
                <label>Tipo de ganancia</label>
                <div className="segmented" style={{ height: 36 }}>
                  <button
                    type="button"
                    className={"seg-btn" + (tipoGanancia === "porcentaje" ? " active" : "")}
                    onClick={() => setTipoGanancia("porcentaje")}
                  >Porcentaje</button>
                  <button
                    type="button"
                    className={"seg-btn" + (tipoGanancia === "monto" ? " active" : "")}
                    onClick={() => setTipoGanancia("monto")}
                  >Monto fijo</button>
                </div>
              </div>
              <div className="pd-field pd-field-wide">
                <label>{tipoGanancia === "porcentaje" ? "Margen (%)" : "Monto sobre costo"}</label>
                <input
                  className="input"
                  type="number" min="0" step="1"
                  value={valorGanancia}
                  onChange={(e) => setValorGanancia(e.target.value)}
                  style={{ fontVariantNumeric: "tabular-nums", textAlign: "right" }}
                />
              </div>
            </div>

            <div className="pd-price-row">
              <span className="pd-price-label">
                Costo del producto
                {tieneBom && (
                  <span style={{ marginLeft: 6, fontSize: 10, color: "var(--ink-muted)" }}>
                    (desde BOM)
                  </span>
                )}
              </span>
              {tieneBom ? (
                <input
                  className="pd-money-input readonly"
                  value={moneyD(costoProducto)}
                  readOnly
                />
              ) : (
                <input
                  className="pd-money-input"
                  type="number" min="0" step="1"
                  value={costoManual}
                  onChange={(e) => setCostoManual(e.target.value)}
                />
              )}
            </div>

            <div className="pd-price-row">
              <span className="pd-price-label">Precio calculado</span>
              <input
                className="pd-money-input readonly"
                value={moneyD(precioCalculado)}
                readOnly
                tabIndex={-1}
              />
            </div>

            <div className="pd-price-row">
              <span className="pd-price-label">Precio ambientadora</span>
              <input
                className="pd-money-input"
                type="number" min="0" step="1"
                value={precioAmb}
                onChange={(e) => setPrecioAmb(e.target.value)}
              />
            </div>

            <div className="pd-price-row grand">
              <span className="pd-price-label">Precio final</span>
              <input
                className="pd-money-input"
                type="number" min="0" step="1"
                value={precioFinal}
                onChange={(e) => setPrecioFinal(e.target.value)}
                style={{
                  fontSize: 18, fontWeight: 500, color: "var(--violet-700)",
                  width: 150,
                }}
              />
            </div>
          </section>
        </div>

        {/* =========== BOM =========== */}
        {tieneBom && (
          <section className="pd-bom">
            <div className="pd-bom-head">
              <h4>Receta · BOM</h4>
              <span className="text-hint" style={{ fontSize: 12 }}>
                Costos aislados — editar el costo unitario acá no afecta a otros productos.
              </span>
            </div>

            <div
              ref={bomTableRef}
              tabIndex={-1}
              className="lines-spreadsheet pd-bom-table"
              onFocus={onBomTableFocus}
              onBlur={onBomTableBlur}
            >
              <table>
                <colgroup>
                  <col style={{ width: 22 }} />
                  <col style={{ width: 130 }} />
                  <col />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 30 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th></th>
                    <th>Tipo</th>
                    <th>Insumo / descripción</th>
                    <th className="num">Cantidad</th>
                    <th className="num">Costo unitario</th>
                    <th className="num">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bom.map((l, idx) => {
                    const filled = !!l.item;
                    const hasError =
                      filled && (!parseFloat(l.qty) || parseFloat(l.qty) <= 0);
                    const isActive = activeRow === l.id;
                    const sub =
                      (parseFloat(l.qty) || 0) * (parseFloat(l.unitCost) || 0);
                    return (
                      <tr
                        key={l.id}
                        className={[
                          "ln-row",
                          isActive && "active",
                          hasError && "error",
                          dragId === l.id && "dragging",
                          dragOverId === l.id && dragId !== l.id && "drag-over",
                        ].filter(Boolean).join(" ")}
                        draggable
                        onDragStart={() => setDragId(l.id)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverId(l.id); }}
                        onDrop={() => onBomDrop(l.id)}
                        onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                        onMouseDown={() => setActiveRow(l.id)}
                      >
                        <td className="grip" title="Arrastrar para reordenar">
                          <I.grip />
                        </td>
                        <td>
                          <select
                            className="cell-select"
                            value={l.tipo}
                            onChange={(e) => updateBomLine(l.id, { tipo: e.target.value })}
                            onFocus={() => setActiveRow(l.id)}
                          >
                            {BOM_TIPOS.map((t) => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="cell-input"
                            list="pd-bom-insumos"
                            value={l.item}
                            onChange={(e) => handleBomItem(l.id, e.target.value)}
                            onFocus={() => setActiveRow(l.id)}
                            placeholder={
                              idx === 0
                                ? "Elegí un insumo del catálogo o escribí texto libre…"
                                : ""
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="cell-input num-input"
                            type="number" min="0" step="0.01"
                            value={l.qty}
                            onChange={(e) => updateBomLine(l.id, { qty: e.target.value })}
                            onFocus={() => setActiveRow(l.id)}
                          />
                        </td>
                        <td>
                          <input
                            className="cell-input num-input"
                            type="number" min="0" step="0.5"
                            value={l.unitCost}
                            onChange={(e) => updateBomLine(l.id, { unitCost: e.target.value })}
                            onFocus={() => setActiveRow(l.id)}
                          />
                        </td>
                        <td className="num cell-subtotal">{moneyD(sub)}</td>
                        <td>
                          <button
                            className="del-btn"
                            onClick={() => removeBomLine(l.id)}
                            title="Eliminar línea"
                          >
                            <I.trash />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <datalist id="pd-bom-insumos">
                {PD_INSUMOS.map((i) => (
                  <option key={i.name} value={i.name} />
                ))}
              </datalist>

              {!editing ? (
                <button
                  type="button"
                  className="add-line-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setBom((ls) => [
                      ...ls,
                      { id: newId(), tipo: "insumo", item: "", qty: "", unitCost: "" },
                    ]);
                    setEditing(true);
                    setTimeout(() => {
                      const inputs = bomTableRef.current?.querySelectorAll(
                        "tbody tr:last-child .cell-input"
                      );
                      inputs?.[0]?.focus();
                    }, 0);
                  }}
                >
                  <I.plus /> Agregar línea
                </button>
              ) : (
                <div className="lines-hint text-hint">
                  <I.grip /> arrastrá para reordenar &nbsp;·&nbsp; ↹ Tab para avanzar
                  &nbsp;·&nbsp; click fuera para cerrar
                </div>
              )}
            </div>

            <div className="pd-bom-total">
              <span className="lbl">Total BOM</span>
              <span className="val">{moneyD(bomTotal)}</span>
            </div>
          </section>
        )}
      </div>

      {/* FOOT */}
      <div className="pd-foot">
        <button className="pd-back-btn" onClick={onBack}>
          <I.back /> Volver al catálogo
        </button>
        <div className="spacer" />
        <button
          className="btn btn-danger"
          onClick={() => onDeleted && onDeleted(seed)}
        >
          <I.trash /> Eliminar producto
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!dirty}
          style={{ opacity: dirty ? 1 : 0.5, pointerEvents: dirty ? "auto" : "none" }}
        >
          <I.check /> Guardar cambios
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   Iconos auxiliares
   ========================================================= */
function ImgIcon() {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
function LockIcon() {
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

Object.assign(window, { ProductoDetalleScreen });
