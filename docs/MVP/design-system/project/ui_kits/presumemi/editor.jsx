/* global React, I, money, PRODUCTS, CLIENTS, PRESUPUESTOS */
// Full-content takeover editor for "Nuevo presupuesto" / "Editar presupuesto".
// 50/50 split: form (left) + live document preview (right, only updates on save).

const { useState: useEState, useMemo: useEMemo, useEffect: useEEffect, useRef: useERef } = React;

// ---------- helpers ----------
const todayMx = () =>
  new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

const niceDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" });
};

// ---------- main component ----------
function PresupuestoEditor({ folio, onClose, onSaved }) {
  const isNew = !folio;
  const existing = !isNew ? PRESUPUESTOS.find(p => p.folio === folio) : null;
  const docFolio = isNew ? "P-1028" : folio;

  // ----- form state -----
  const [client, setClient]       = useEState(existing?.client || "");
  const [tematica, setTematica]   = useEState(existing?.event || "");
  const [fFiesta, setFFiesta]     = useEState("");
  const [fEntrega, setFEntrega]   = useEState("");
  const [envio, setEnvio]         = useEState("retira"); // retira | envio
  const [lugar, setLugar]         = useEState("");
  const [pago, setPago]           = useEState("");
  const [sena, setSena]           = useEState("");
  const [resto, setResto]         = useEState("");
  const [notes, setNotes]         = useEState("");
  const [includeNotes, setIN]     = useEState(true);

  // ----- lines (spreadsheet) -----
  const initialLines = isNew
    ? [{ id: 1, product: "", qty: "", price: "" }]
    : [
        { id: 1, product: PRODUCTS[0].name, qty: 8, price: PRODUCTS[0].price },
        { id: 2, product: PRODUCTS[2].name, qty: 4, price: PRODUCTS[2].price },
      ];
  const [lines, setLines]         = useEState(initialLines);
  const [activeRow, setActiveRow] = useEState(null);
  const [editing, setEditing]     = useEState(false);
  const [dragId, setDragId]       = useEState(null);
  const [dragOverId, setDragOver] = useEState(null);
  const tableRef                  = useERef(null);
  const idRef                     = useERef(initialLines.length + 1);
  const mkId = () => ++idRef.current;

  // ----- preview snapshot (only updates on save) -----
  const [snap, setSnap]           = useEState(null);

  // Prepopulate "Lugar de envío" when switching to envío
  useEEffect(() => {
    if (envio === "envio" && !lugar) {
      setLugar("Av. Insurgentes Sur 1234, Roma Nte., 06700 CDMX");
    }
  }, [envio]); // eslint-disable-line

  // ----- derived -----
  const subtotal = useEMemo(
    () => lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0), 0),
    [lines]
  );
  const total = subtotal; // sin IVA

  // ----- line ops -----
  const updateLine = (id, patch) => setLines(ls => {
    const next = ls.map(l => l.id === id ? { ...l, ...patch } : l);
    if (editing) {
      const last = next[next.length - 1];
      const lastEmpty = !last.product && !last.qty && !last.price;
      if (!lastEmpty) next.push({ id: mkId(), product: "", qty: "", price: "" });
    }
    return next;
  });
  const removeLine = (id) => setLines(ls => {
    const next = ls.filter(l => l.id !== id);
    return next.length ? next : [{ id: mkId(), product: "", qty: "", price: "" }];
  });

  const handleProductChange = (id, val) => {
    const p = PRODUCTS.find(p => p.name === val);
    const patch = { product: val };
    if (p) patch.price = p.price;
    updateLine(id, patch);
  };

  const handleTableFocus = () => {
    if (!editing) {
      setEditing(true);
      setLines(ls => {
        const last = ls[ls.length - 1];
        const lastEmpty = !last.product && !last.qty && !last.price;
        return lastEmpty ? ls : [...ls, { id: mkId(), product: "", qty: "", price: "" }];
      });
    }
  };
  const handleTableBlur = (e) => {
    if (tableRef.current && e.relatedTarget && tableRef.current.contains(e.relatedTarget)) return;
    setEditing(false);
    setActiveRow(null);
    setLines(ls => {
      if (ls.length <= 1) return ls;
      const last = ls[ls.length - 1];
      const lastEmpty = !last.product && !last.qty && !last.price;
      return lastEmpty ? ls.slice(0, -1) : ls;
    });
  };

  // ----- drag and drop -----
  const onDrop = (id) => {
    if (dragId == null || dragId === id) { setDragId(null); setDragOver(null); return; }
    setLines(ls => {
      const from = ls.findIndex(l => l.id === dragId);
      const to   = ls.findIndex(l => l.id === id);
      if (from < 0 || to < 0) return ls;
      const next = ls.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null); setDragOver(null);
  };

  // ----- save -----
  const captureSnapshot = (status) => ({
    folio: docFolio,
    client, tematica, fFiesta, fEntrega,
    envio, lugar, pago,
    sena: parseFloat(sena) || 0,
    resto: parseFloat(resto) || 0,
    lines: lines.filter(l => l.product && parseFloat(l.qty) > 0),
    subtotal, total, notes, includeNotes, status,
    savedAt: new Date().toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
  });

  const handleDraft = () => setSnap(captureSnapshot("borrador"));
  const handleSend = () => {
    setSnap(captureSnapshot("enviado"));
    setTimeout(() => onSaved(`Presupuesto enviado a ${client || "el cliente"}.`), 700);
  };

  return (
    <div className="editor-overlay" data-screen-label={isNew ? "Nuevo presupuesto" : "Editar presupuesto"}>
      <Heartbeat />

      {/* Header */}
      <div className="editor-head">
        <button className="icon-btn" onClick={onClose} title="Volver"><I.back /></button>
        <div className="editor-title">
          <span className="eyebrow">Presupuesto · <span className="folio">{docFolio}</span></span>
          <h2>{isNew ? "Nuevo presupuesto" : "Editar presupuesto"}</h2>
        </div>
        <div className="spacer"></div>
        {snap && (
          <span className="save-chip">
            <span className="dot"></span> Guardado · {snap.savedAt}
          </span>
        )}
      </div>

      {/* Split body */}
      <div className="editor-split">
        {/* ============ LEFT: form ============ */}
        <div className="editor-form">
          <FormSection step="1" title="Cliente y evento">
            <div className="form-row">
              <Field label="Cliente">
                <input className="input" list="ed-clients" value={client}
                  onChange={e => setClient(e.target.value)}
                  placeholder="Buscar o agregar cliente…" />
                <datalist id="ed-clients">{CLIENTS.map(c => <option key={c} value={c} />)}</datalist>
              </Field>
              <Field label="Temática">
                <input className="input" value={tematica}
                  onChange={e => setTematica(e.target.value)}
                  placeholder="Ej. Jardín pastel, dinosaurios, neón…" />
              </Field>
            </div>
            <div className="form-row">
              <DateField label="Fecha de fiesta"  value={fFiesta}  onChange={setFFiesta} />
              <DateField label="Fecha de entrega" value={fEntrega} onChange={setFEntrega} />
            </div>
          </FormSection>

          <FormSection step="2" title="Entrega">
            <div className="form-row form-row-envio">
              <Field label="Método de envío">
                <Segmented value={envio} onChange={setEnvio} options={[
                  { value: "retira", label: "Retira" },
                  { value: "envio",  label: "Envío" },
                ]} />
              </Field>
              {envio === "envio" && (
                <Field label="Lugar de envío">
                  <input className="input" value={lugar}
                    onChange={e => setLugar(e.target.value)}
                    placeholder="Calle, número, colonia, CP" />
                </Field>
              )}
            </div>
          </FormSection>

          <FormSection step="3" title="Pago">
            <div className="form-row form-row-3">
              <Field label="Método de pago">
                <input className="input" value={pago}
                  onChange={e => setPago(e.target.value)}
                  placeholder="Transferencia, MP, efectivo…" />
              </Field>
              <Field label="Seña">
                <MoneyInput value={sena} onChange={setSena} />
              </Field>
              <Field label="Resto">
                <MoneyInput value={resto} onChange={setResto} />
              </Field>
            </div>
          </FormSection>

          <FormSection step="4" title="Productos">
            <div
              ref={tableRef}
              tabIndex={-1}
              className="lines-spreadsheet"
              onFocus={handleTableFocus}
              onBlur={handleTableBlur}
            >
              <table>
                <colgroup>
                  <col style={{ width: 22 }} />
                  <col />
                  <col style={{ width: 58 }} />
                  <col style={{ width: 86 }} />
                  <col style={{ width: 92 }} />
                  <col style={{ width: 30 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th></th>
                    <th>Producto / descripción</th>
                    <th className="num">Cant.</th>
                    <th className="num">Precio</th>
                    <th className="num">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, idx) => {
                    const filled = !!l.product;
                    const hasError = filled && (!parseFloat(l.qty) || parseFloat(l.qty) <= 0);
                    const isActive = activeRow === l.id;
                    const sub = (parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0);
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
                        onDragOver={e => { e.preventDefault(); setDragOver(l.id); }}
                        onDrop={() => onDrop(l.id)}
                        onDragEnd={() => { setDragId(null); setDragOver(null); }}
                        onMouseDown={() => setActiveRow(l.id)}
                      >
                        <td className="grip" title="Arrastrar para reordenar"><I.grip /></td>
                        <td>
                          <input
                            className="cell-input"
                            list="ed-products"
                            value={l.product}
                            onChange={e => handleProductChange(l.id, e.target.value)}
                            onFocus={() => setActiveRow(l.id)}
                            placeholder={idx === 0 ? "Producto, descripción o catálogo…" : ""}
                          />
                        </td>
                        <td>
                          <input
                            className="cell-input num-input"
                            type="number" min="0" step="1"
                            value={l.qty}
                            onChange={e => updateLine(l.id, { qty: e.target.value })}
                            onFocus={() => setActiveRow(l.id)}
                          />
                        </td>
                        <td>
                          <input
                            className="cell-input num-input"
                            type="number" min="0" step="0.5"
                            value={l.price}
                            onChange={e => updateLine(l.id, { price: e.target.value })}
                            onFocus={() => setActiveRow(l.id)}
                          />
                        </td>
                        <td className="num cell-subtotal">{money(sub)}</td>
                        <td>
                          <button className="del-btn" onClick={() => removeLine(l.id)}
                            title="Eliminar línea"><I.trash /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <datalist id="ed-products">
                {PRODUCTS.map(p => <option key={p.id} value={p.name} />)}
              </datalist>

              {!editing ? (
                <button type="button" className="add-line-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setLines(ls => [...ls, { id: mkId(), product: "", qty: "", price: "" }]);
                    setEditing(true);
                    setTimeout(() => {
                      const inputs = tableRef.current?.querySelectorAll("tbody tr:last-child .cell-input");
                      inputs?.[0]?.focus();
                    }, 0);
                  }}>
                  <I.plus /> Agregar línea
                </button>
              ) : (
                <div className="lines-hint text-hint">
                  <I.grip /> arrastrá para reordenar &nbsp;·&nbsp; ↹ Tab para avanzar &nbsp;·&nbsp; click fuera para cerrar
                </div>
              )}
            </div>

            <div className="ed-totals">
              <div className="r"><span>Subtotal</span><span className="num">{money(subtotal)}</span></div>
              <div className="r grand">
                <span>Total</span><span className="num v">{money(total)}</span>
              </div>
            </div>
          </FormSection>

          <FormSection step="5" title="Notas">
            <Field>
              <textarea className="textarea" value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Detalles para el cliente: incluye montaje, instrucciones de retiro, alergenos, etc." />
            </Field>
            <label className="check-row">
              <input type="checkbox" checked={includeNotes} onChange={e => setIN(e.target.checked)} />
              <span>Incluir en impresión / vista web</span>
            </label>
          </FormSection>

          <div className="form-tailspace"></div>
        </div>

        {/* ============ RIGHT: preview ============ */}
        <div className="editor-preview">
          {snap ? <PreviewDoc data={snap} /> : <EmptyPreview />}
        </div>
      </div>

      {/* Action bar */}
      <div className="editor-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <div className="spacer"></div>
        {snap && <span className="text-hint" style={{ marginRight: 6 }}>
          Vista previa actualizada
        </span>}
        <button className="btn btn-secondary" onClick={handleDraft}>Guardar borrador</button>
        <button className="btn btn-primary" onClick={handleSend}>
          Enviar <I.arrowRight />
        </button>
      </div>
    </div>
  );
}

// ---------- small subcomponents ----------
function FormSection({ step, title, children }) {
  return (
    <section className="form-section">
      <header className="form-section-head">
        <span className="step-pill">{step}</span>
        <h4>{title}</h4>
      </header>
      <div className="form-section-body">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="date-wrap">
        <I.calendar />
        <input type="date" className="input date-input"
          value={value} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented" role="tablist">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={"seg-btn" + (value === o.value ? " active" : "")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MoneyInput({ value, onChange }) {
  return (
    <div className="money-wrap">
      <span className="money-prefix">$</span>
      <input className="input money-input" type="number" min="0" step="0.5"
        value={value} onChange={e => onChange(e.target.value)}
        placeholder="0.00" />
    </div>
  );
}

// ---------- empty preview placeholder ----------
function EmptyPreview() {
  return (
    <div className="preview-empty">
      <I.docDashed />
      <p>El presupuesto aparecerá aquí al guardar.</p>
      <small>Vista del documento como lo recibe el cliente.</small>
    </div>
  );
}

// ---------- document preview ----------
function PreviewDoc({ data }) {
  const restoCalc = data.resto || Math.max(0, data.total - (data.sena || 0));
  return (
    <div className="preview-doc">
      <header className="doc-head">
        <img src="../../assets/memydeni-logo.png" alt="MemyDeni" />
        <div className="doc-meta">
          <div className="folio">{data.folio}</div>
          <div className="text-hint">{todayMx()}</div>
        </div>
      </header>

      <div className="doc-customer">
        <div className="who-block">
          <small>Para</small>
          <div className="who">{data.client || "—"}</div>
          {data.tematica && <div className="text-hint">Temática · {data.tematica}</div>}
        </div>
        <div className="doc-dates">
          {data.fFiesta && (
            <div><small>Fiesta</small><span>{niceDate(data.fFiesta)}</span></div>
          )}
          {data.fEntrega && (
            <div><small>Entrega</small><span>{niceDate(data.fEntrega)}</span></div>
          )}
        </div>
      </div>

      {data.lines.length > 0 ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th className="num">Cant.</th>
              <th className="num">Precio</th>
              <th className="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map(l => (
              <tr key={l.id}>
                <td>{l.product}</td>
                <td className="num">{l.qty}</td>
                <td className="num">{money(parseFloat(l.price))}</td>
                <td className="num">{money(parseFloat(l.qty) * parseFloat(l.price))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty-rows">Sin productos aún.</div>
      )}

      <div className="doc-totals">
        <div className="r"><span>Subtotal</span><span className="num">{money(data.subtotal)}</span></div>
        <div className="r big"><span>Total</span><span className="num">{money(data.total)}</span></div>
        {data.sena > 0 && (
          <div className="doc-pay">
            <div className="r small">
              <span>Seña{data.pago ? ` (${data.pago})` : ""}</span>
              <span className="num">{money(data.sena)}</span>
            </div>
            <div className="r small">
              <span>Resto a pagar</span>
              <span className="num">{money(restoCalc)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="doc-grid">
        <div className="doc-block">
          <small>Entrega</small>
          <div className="block-body">
            {data.envio === "envio"
              ? <>Envío a domicilio<br /><span className="text-hint">{data.lugar || "—"}</span></>
              : <>Retira en tienda</>}
          </div>
        </div>
        <div className="doc-block">
          <small>Contacto</small>
          <div className="block-body">
            MemyDeni · Papelería para fiestas<br />
            <span className="text-hint">hola@memydeni.mx · +52 55 1234 5678</span>
          </div>
        </div>
      </div>

      {data.includeNotes && data.notes && (
        <div className="doc-notes">
          <small>Notas</small>
          <p>{data.notes}</p>
        </div>
      )}

      <footer className="doc-foot text-hint">
        Precios en MXN. Vigencia 14 días. Gracias por confiar en MemyDeni 💌
      </footer>
    </div>
  );
}

// ---------- entry heartbeat (EKG line traveling right → sidebar) ----------
function Heartbeat() {
  return (
    <div className="heartbeat-overlay" aria-hidden>
      <svg viewBox="0 0 1000 80" preserveAspectRatio="none">
        <path
          d="M0 40 L 460 40 L 480 40 L 498 18 L 514 64 L 532 16 L 548 50 L 568 40 L 1000 40"
          fill="none"
          stroke="var(--violet-700)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

Object.assign(window, { PresupuestoEditor });
