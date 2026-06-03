/* global React, I, PRESUPUESTOS, CLIENTS */
// Drawers + datasets for the Finanzas screen.
// Exposes MovimientoDrawer, ImprentaDrawer, MOVIMIENTOS, IMPRENTA_ORDENES,
// TIPO_MOVIMIENTOS, CUENTAS, METODOS_PAGO, fmtFechaMov, signedMoney.

const { useState: useFDState, useMemo: useFDMemo, useEffect: useFDEffect } = React;

/* =========================================================
   Catálogos (etiqueta visible y key estable)
   ========================================================= */
const TIPO_MOVIMIENTOS = [
  { id: "ingresos",    label: "Ingresos",    sign:  1 },
  { id: "insumos",     label: "Insumos",     sign: -1 },
  { id: "cameo",       label: "Cameo",       sign: -1 },
  { id: "embalaje",    label: "Embalaje",    sign: -1 },
  { id: "meme",        label: "Meme",        sign: -1 },
  { id: "pety",        label: "Pety",        sign: -1 },
  { id: "gastos",      label: "Gastos",      sign: -1 },
  { id: "iva",         label: "IVA",         sign: -1 },
  { id: "monotributo", label: "Monotributo", sign: -1 },
  { id: "contadora",   label: "Contadora",   sign: -1 },
  { id: "comisiones",  label: "Comisiones",  sign: -1 },
  { id: "intereses",   label: "Intereses",   sign:  1 },
];

const TIPO_BADGE_TONE = {
  ingresos:    { bg: "#D7F2EF", color: "#1F6864" }, // teal soft
  insumos:     { bg: "#EFE6F0", color: "#5C2D54" }, // violet soft
  cameo:       { bg: "#FBE7D8", color: "#8A4A1D" }, // peach
  embalaje:    { bg: "#E7E2D5", color: "#5C5238" }, // sand
  meme:        { bg: "#FCE5EB", color: "#8A2F4A" }, // pink
  pety:        { bg: "#E8EDFF", color: "#324081" }, // periwinkle
  gastos:      { bg: "#FCEAE4", color: "#A4361C" }, // coral
  iva:         { bg: "#FFF1C7", color: "#7A5A00" }, // yellow
  monotributo: { bg: "#E2EEFF", color: "#22497A" }, // sky
  contadora:   { bg: "#DDE5DA", color: "#3B5A3F" }, // sage
  comisiones:  { bg: "#F0E1F0", color: "#6E2B71" }, // mauve
  intereses:   { bg: "#D0EADD", color: "#1F5A3E" }, // mint
};

const CUENTAS = [
  { id: "banco",         label: "Banco" },
  { id: "mercado_pago",  label: "Mercado Pago" },
  { id: "efectivo",      label: "Efectivo" },
];

const METODOS_PAGO = [
  { id: "efectivo",      label: "Efectivo"      },
  { id: "transferencia", label: "Transferencia" },
  { id: "mercado_pago",  label: "Mercado Pago"  },
  { id: "tarjeta",       label: "Tarjeta"       },
  { id: "cheque",        label: "Cheque"        },
];

/* =========================================================
   Data demo
   ========================================================= */
const MOVIMIENTOS = [
  { id:  1, fecha: "2026-05-23", tipo: "ingresos",    cuenta: "mercado_pago", ref: "P-1024", detalle: "Marisol Aguirre · cumple Mila",   nroFactura: "B-00012345", monto:   4820, presupuestoId: "P-1024" },
  { id:  2, fecha: "2026-05-22", tipo: "insumos",     cuenta: "banco",        ref: "Compra",  detalle: "Papel kraft 70 g (5 pliegos)",   nroFactura: "A-9982",     monto:   -640, presupuestoId: "" },
  { id:  3, fecha: "2026-05-21", tipo: "ingresos",    cuenta: "banco",        ref: "P-1023", detalle: "Andrea Vázquez · boda Quilmes",   nroFactura: "B-00012346", monto:  12480, presupuestoId: "P-1023" },
  { id:  4, fecha: "2026-05-20", tipo: "embalaje",    cuenta: "efectivo",     ref: "Compra",  detalle: "Cajas golosineras x40",          nroFactura: "",           monto:   -380, presupuestoId: "" },
  { id:  5, fecha: "2026-05-19", tipo: "cameo",       cuenta: "mercado_pago", ref: "Cameo",  detalle: "Bocadillos Mila & Tomás",         nroFactura: "B-3320",     monto:   -540, presupuestoId: "" },
  { id:  6, fecha: "2026-05-18", tipo: "ingresos",    cuenta: "efectivo",     ref: "P-1021", detalle: "Familia Rojas · bautismo",        nroFactura: "B-00012347", monto:   3420, presupuestoId: "P-1021" },
  { id:  7, fecha: "2026-05-17", tipo: "meme",        cuenta: "banco",        ref: "Aporte",  detalle: "Reposición taller mayo",         nroFactura: "",           monto:   -350, presupuestoId: "" },
  { id:  8, fecha: "2026-05-16", tipo: "comisiones",  cuenta: "mercado_pago", ref: "MP",     detalle: "Comisión por cobros mayo",       nroFactura: "MP-MAY-1",   monto:   -180, presupuestoId: "" },
  { id:  9, fecha: "2026-05-15", tipo: "pety",        cuenta: "efectivo",     ref: "Aporte",  detalle: "Pety semanal",                   nroFactura: "",           monto:   -200, presupuestoId: "" },
  { id: 10, fecha: "2026-05-14", tipo: "monotributo", cuenta: "banco",        ref: "AFIP",   detalle: "Categoría B mayo",                nroFactura: "AFIP-2026-05",monto: -1090,  presupuestoId: "" },
  { id: 11, fecha: "2026-05-12", tipo: "ingresos",    cuenta: "banco",        ref: "P-1020", detalle: "Iván Castillo · cumple Lola",     nroFactura: "B-00012348", monto:   1980, presupuestoId: "P-1020" },
  { id: 12, fecha: "2026-05-11", tipo: "iva",         cuenta: "banco",        ref: "DGI",    detalle: "Declaración abril 2026",          nroFactura: "DGI-04-26",  monto:  -1240, presupuestoId: "" },
  { id: 13, fecha: "2026-05-08", tipo: "contadora",   cuenta: "transferencia",ref: "Honorarios", detalle: "Contadora · cierre abril",   nroFactura: "C-0084",     monto:   -850, presupuestoId: "" },
  { id: 14, fecha: "2026-05-06", tipo: "gastos",      cuenta: "efectivo",     ref: "Cafetería", detalle: "Café reunión proveedora",      nroFactura: "",           monto:    -95, presupuestoId: "" },
  { id: 15, fecha: "2026-05-04", tipo: "intereses",   cuenta: "banco",        ref: "Plazo fijo", detalle: "Intereses ganados abril",     nroFactura: "",           monto:    320, presupuestoId: "" },
].map((m) => ({ ...m, cuenta: m.cuenta === "transferencia" ? "banco" : m.cuenta }));

const IMPRENTA_ORDENES = [
  { id: 1, fecha: "2026-05-22", presupuestoId: "P-1024", tematica: "Cumple Mila · unicornios pastel", hojas:  80, tipoHoja: "Opalina A4 220 g",   valorNuestro: 1600, valorPatri: 1280, metodoPago: "transferencia", pagado: true  },
  { id: 2, fecha: "2026-05-20", presupuestoId: "P-1023", tematica: "Boda Andrea · botánico",          hojas: 220, tipoHoja: "Fotográfico A3 250 g", valorNuestro: 5280, valorPatri: 5050, metodoPago: "transferencia", pagado: true  },
  { id: 3, fecha: "2026-05-18", presupuestoId: "P-1021", tematica: "Bautismo Joaco · celestes",       hojas:  60, tipoHoja: "Opalina A4 200 g",   valorNuestro: 1320, valorPatri: 1400, metodoPago: "efectivo",      pagado: false },
  { id: 4, fecha: "2026-05-15", presupuestoId: "",       tematica: "Stock pasteles · varios",        hojas: 120, tipoHoja: "Opalina A3 200 g",   valorNuestro: 2400, valorPatri: 1980, metodoPago: "efectivo",      pagado: true  },
  { id: 5, fecha: "2026-05-12", presupuestoId: "P-1020", tematica: "Cumple Lola · circo",            hojas:  90, tipoHoja: "Madera A4 180 g",     valorNuestro: 1980, valorPatri: 2120, metodoPago: "mercado_pago",  pagado: false },
];

/* =========================================================
   Helpers
   ========================================================= */
const PRESUPUESTO_OPTIONS = (typeof PRESUPUESTOS !== "undefined" ? PRESUPUESTOS : []).map((p) => p.folio);
const MES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function fmtFechaMov(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")} ${MES_SHORT[d.getMonth()]}`;
}

function signedMoney(n) {
  const abs = Math.abs(Number(n) || 0);
  const sign = n >= 0 ? "+ " : "− ";
  return sign + "$ " + abs.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const newFDId = (() => { let i = 100; return () => ++i; })();

/* =========================================================
   Heartbeat overlay component (separate from productos one)
   ========================================================= */
function FinanzasHeartbeat({ k }) {
  return (
    <div className="fin-heartbeat-layer" key={k} aria-hidden="true">
      <div className="fin-heartbeat-pulse" />
      <div className="fin-heartbeat-line">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path
            className="ekg-path"
            d="M0,30 L420,30 L460,30 L478,12 L498,46 L514,4 L536,52 L556,28 L600,30 L1200,30"
          />
        </svg>
      </div>
    </div>
  );
}

/* =========================================================
   MovimientoDrawer
   ========================================================= */
function MovimientoDrawer({ movimiento, onClose, onSaved }) {
  const isNew = !movimiento;
  const seed = movimiento || {
    fecha: new Date().toISOString().slice(0, 10),
    tipo: "ingresos",
    cuenta: "banco",
    monto: 0,
    detalle: "",
    nroFactura: "",
    presupuestoId: "",
  };

  const [fecha, setFecha]                 = useFDState(seed.fecha);
  const [tipo, setTipo]                   = useFDState(seed.tipo);
  const [cuenta, setCuenta]               = useFDState(seed.cuenta);
  const tipoMeta = TIPO_MOVIMIENTOS.find((t) => t.id === tipo);
  const [signo, setSigno]                 = useFDState((seed.monto >= 0) ? "in" : "out");
  const [valor, setValor]                 = useFDState(Math.abs(seed.monto) || 0);
  const [detalle, setDetalle]             = useFDState(seed.detalle || "");
  const [nroFactura, setNroFactura]       = useFDState(seed.nroFactura || "");
  const [presupuestoId, setPresupuestoId] = useFDState(seed.presupuestoId || "");

  // Sync signo cuando se cambia tipo
  useFDEffect(() => {
    if (tipoMeta) setSigno(tipoMeta.sign > 0 ? "in" : "out");
  }, [tipo]);

  const monto = (signo === "in" ? 1 : -1) * (parseFloat(valor) || 0);
  const moneyAbs = "$ " + (parseFloat(valor) || 0).toLocaleString("es-MX",
    { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const save = () => {
    onSaved && onSaved({
      ...(movimiento || {}),
      id: movimiento?.id || newFDId(),
      fecha, tipo, cuenta,
      monto,
      detalle, nroFactura, presupuestoId,
    }, isNew);
  };

  return (
    <>
      <div className="drawer-scrim" onClick={onClose}></div>
      <aside className="drawer">
        <div className="drawer-head">
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            <span style={{
              fontSize: 11, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--ink-muted)", fontWeight: 500,
            }}>
              {isNew ? "Nuevo movimiento" : "Editar movimiento"}
            </span>
            <h3>{tipoMeta?.label || "Movimiento"}</h3>
          </div>
          <button className="icon-btn" onClick={onClose}><I.close /></button>
        </div>

        <div className="drawer-body">
          <div className="fd-row">
            <div className="field">
              <label>Fecha</label>
              <input
                className="input"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Cuenta</label>
              <select
                className="select"
                value={cuenta}
                onChange={(e) => setCuenta(e.target.value)}
              >
                {CUENTAS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="fd-row single">
            <div className="field">
              <label>Tipo de movimiento</label>
              <select
                className="select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                {TIPO_MOVIMIENTOS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="fd-row single">
            <div className="field">
              <label>Valor</label>
              <div className="fd-sign-toggle" role="group" aria-label="Signo">
                <button
                  type="button"
                  className={signo === "in" ? "active in" : ""}
                  onClick={() => setSigno("in")}
                >+ Ingreso</button>
                <button
                  type="button"
                  className={signo === "out" ? "active out" : ""}
                  onClick={() => setSigno("out")}
                >− Egreso</button>
              </div>
              <input
                className={"fd-money-input " + (signo === "in" ? "income" : "expense")}
                type="number" min="0" step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0"
              />
              <span className="hint" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                Equivale a {signo === "in" ? "+ " : "− "}{moneyAbs} en la cuenta {(CUENTAS.find((c) => c.id === cuenta) || {}).label}.
              </span>
            </div>
          </div>

          <div className="fd-row single">
            <div className="field">
              <label>Detalle</label>
              <textarea
                className="textarea"
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder="Ej. cobro presupuesto P-1024 · Marisol Aguirre"
              />
            </div>
          </div>

          <div className="fd-row">
            <div className="field">
              <label>Nro. de factura</label>
              <input
                className="input"
                value={nroFactura}
                onChange={(e) => setNroFactura(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="field">
              <label>Presupuesto</label>
              <input
                className="input"
                list="fd-presupuestos"
                value={presupuestoId}
                onChange={(e) => setPresupuestoId(e.target.value)}
                placeholder="P-1024 (opcional)"
              />
              <datalist id="fd-presupuestos">
                {PRESUPUESTO_OPTIONS.map((p) => (<option key={p} value={p} />))}
              </datalist>
            </div>
          </div>

          <div className="fd-summary">
            <div className="row">
              <span style={{ color: "var(--ink-muted)" }}>Tipo</span>
              <span>{tipoMeta?.label}</span>
            </div>
            <div className="row">
              <span style={{ color: "var(--ink-muted)" }}>Cuenta</span>
              <span>{(CUENTAS.find((c) => c.id === cuenta) || {}).label}</span>
            </div>
            <div className="row grand">
              <span>Impacto</span>
              <span style={{ color: signo === "in" ? "#2E6F70" : "var(--coral-500)" }}>
                {signedMoney(monto)}
              </span>
            </div>
          </div>
        </div>

        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>
            <I.check /> Guardar
          </button>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   ImprentaDrawer
   ========================================================= */
function ImprentaDrawer({ orden, onClose, onSaved }) {
  const isNew = !orden;
  const seed = orden || {
    fecha: new Date().toISOString().slice(0, 10),
    presupuestoId: "",
    tematica: "",
    hojas: 0,
    tipoHoja: "Opalina A4 220 g",
    valorNuestro: 0,
    valorPatri: 0,
    metodoPago: "transferencia",
    pagado: false,
  };

  const [fecha, setFecha]                 = useFDState(seed.fecha);
  const [presupuestoId, setPresupuestoId] = useFDState(seed.presupuestoId || "");
  const [tematica, setTematica]           = useFDState(seed.tematica || "");
  const [hojas, setHojas]                 = useFDState(seed.hojas || 0);
  const [tipoHoja, setTipoHoja]           = useFDState(seed.tipoHoja || "");
  const [valorNuestro, setValorNuestro]   = useFDState(seed.valorNuestro || 0);
  const [valorPatri, setValorPatri]       = useFDState(seed.valorPatri || 0);
  const [metodoPago, setMetodoPago]       = useFDState(seed.metodoPago || "transferencia");
  const [pagado, setPagado]               = useFDState(!!seed.pagado);

  const diff = (parseFloat(valorNuestro) || 0) - (parseFloat(valorPatri) || 0);

  const save = () => {
    onSaved && onSaved({
      ...(orden || {}),
      id: orden?.id || newFDId(),
      fecha, presupuestoId, tematica,
      hojas: parseFloat(hojas) || 0,
      tipoHoja,
      valorNuestro: parseFloat(valorNuestro) || 0,
      valorPatri:   parseFloat(valorPatri)   || 0,
      metodoPago, pagado,
    }, isNew);
  };

  return (
    <>
      <div className="drawer-scrim" onClick={onClose}></div>
      <aside className="drawer">
        <div className="drawer-head">
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            <span style={{
              fontSize: 11, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--ink-muted)", fontWeight: 500,
            }}>
              {isNew ? "Nueva orden de imprenta" : "Editar orden de imprenta"}
            </span>
            <h3>{tematica || "Orden sin temática"}</h3>
          </div>
          <button className="icon-btn" onClick={onClose}><I.close /></button>
        </div>

        <div className="drawer-body">
          <div className="fd-row">
            <div className="field">
              <label>Fecha</label>
              <input
                className="input"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Presupuesto</label>
              <input
                className="input"
                list="fd-presupuestos-i"
                value={presupuestoId}
                onChange={(e) => setPresupuestoId(e.target.value)}
                placeholder="P-1024 (opcional)"
              />
              <datalist id="fd-presupuestos-i">
                {PRESUPUESTO_OPTIONS.map((p) => (<option key={p} value={p} />))}
              </datalist>
            </div>
          </div>

          <div className="fd-row single">
            <div className="field">
              <label>Temática / cliente</label>
              <input
                className="input"
                value={tematica}
                onChange={(e) => setTematica(e.target.value)}
                placeholder="Ej. Cumple Mila · unicornios pastel"
              />
            </div>
          </div>

          <div className="fd-row">
            <div className="field">
              <label>Cantidad de hojas</label>
              <input
                className="input"
                type="number" min="0" step="1"
                value={hojas}
                onChange={(e) => setHojas(e.target.value)}
                style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
              />
            </div>
            <div className="field">
              <label>Tipo de hoja</label>
              <input
                className="input"
                value={tipoHoja}
                onChange={(e) => setTipoHoja(e.target.value)}
                placeholder="Opalina A4 220 g"
              />
            </div>
          </div>

          <div className="fd-section-label">Valores</div>
          <div className="fd-row">
            <div className="field">
              <label>Valor nuestro</label>
              <input
                className="fd-money-input"
                type="number" min="0" step="0.01"
                value={valorNuestro}
                onChange={(e) => setValorNuestro(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Valor Patri</label>
              <input
                className="fd-money-input"
                type="number" min="0" step="0.01"
                value={valorPatri}
                onChange={(e) => setValorPatri(e.target.value)}
              />
            </div>
          </div>

          <div className="fd-summary">
            <div className="row">
              <span style={{ color: "var(--ink-muted)" }}>Valor nuestro</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                $ {(parseFloat(valorNuestro) || 0).toLocaleString("es-MX")}
              </span>
            </div>
            <div className="row">
              <span style={{ color: "var(--ink-muted)" }}>Valor Patri</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                $ {(parseFloat(valorPatri) || 0).toLocaleString("es-MX")}
              </span>
            </div>
            <div className="row grand">
              <span>Diferencia</span>
              <span
                className={diff >= 0 ? "fin-diff-pos" : "fin-diff-neg"}
                style={{ fontSize: 16 }}
              >
                {diff >= 0 ? "+ " : "− "}$ {Math.abs(diff).toLocaleString("es-MX")}
              </span>
            </div>
          </div>

          <div className="fd-section-label" style={{ marginTop: 16 }}>Pago</div>
          <div className="fd-row">
            <div className="field">
              <label>Método de pago</label>
              <select
                className="select"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Estado</label>
              <label className="check-row" style={{ marginTop: 2 }}>
                <input
                  type="checkbox"
                  checked={pagado}
                  onChange={(e) => setPagado(e.target.checked)}
                />
                <div className="lbl-block">
                  <span className="t">Pagado a la imprenta</span>
                  <span className="h">{pagado ? "Registrado como pagado." : "Pendiente de pago."}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>
            <I.check /> Guardar
          </button>
        </div>
      </aside>
    </>
  );
}

Object.assign(window, {
  MovimientoDrawer,
  ImprentaDrawer,
  FinanzasHeartbeat,
  MOVIMIENTOS,
  IMPRENTA_ORDENES,
  TIPO_MOVIMIENTOS,
  TIPO_BADGE_TONE,
  CUENTAS,
  METODOS_PAGO,
  fmtFechaMov,
  signedMoney,
});
