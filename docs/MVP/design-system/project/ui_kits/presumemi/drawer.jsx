/* global React, I, Badge, money, PRODUCTS, PRESUPUESTOS, STATUS_TONES, CLIENTS */
const { useState: useDState, useMemo: useDMemo } = React;

function PresupuestoDrawer({ folio, onClose, onSaved }) {
  const existing = folio ? PRESUPUESTOS.find(p => p.folio === folio) : null;
  const isNew = !existing;
  const initialLines = isNew
    ? [{ id: 1, product: PRODUCTS[0].name, qty: 1, price: PRODUCTS[0].price }]
    : [
        { id: 1, product: PRODUCTS[0].name, qty: 8,  price: PRODUCTS[0].price },
        { id: 2, product: PRODUCTS[2].name, qty: 4,  price: PRODUCTS[2].price },
        { id: 3, product: PRODUCTS[5].name, qty: 2,  price: PRODUCTS[5].price },
      ];

  const [client, setClient] = useDState(existing?.client || "");
  const [event, setEvent]   = useDState(existing?.event || "Cumpleaños");
  const [lines, setLines]   = useDState(initialLines);
  const [notes, setNotes]   = useDState("");

  const subtotal = useDMemo(() => lines.reduce((s, l) => s + l.qty * l.price, 0), [lines]);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const updateLine = (id, patch) =>
    setLines(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
  const removeLine = (id) => setLines(ls => ls.filter(l => l.id !== id));
  const addLine = () =>
    setLines(ls => [...ls, {
      id: Date.now(),
      product: PRODUCTS[0].name, qty: 1, price: PRODUCTS[0].price
    }]);

  return (
    <>
      <div className="drawer-scrim" onClick={onClose}></div>
      <aside className="drawer">
        <div className="drawer-head">
          <h3>{isNew ? "Nuevo presupuesto" : existing.folio}</h3>
          {!isNew && (() => { const s = STATUS_TONES[existing.status]; return <Badge tone={s.tone} dot>{s.label}</Badge>; })()}
          <div className="spacer"></div>
          <button className="icon-btn" onClick={onClose}><I.close /></button>
        </div>

        <div className="drawer-body">
          <div className="grid-2" style={{ marginBottom: 18 }}>
            <div className="field">
              <label>Cliente</label>
              <input className="input" list="clients" value={client} onChange={e => setClient(e.target.value)} placeholder="Nombre del cliente" />
              <datalist id="clients">{CLIENTS.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="field">
              <label>Tipo de evento</label>
              <select className="select" value={event} onChange={e => setEvent(e.target.value)}>
                <option>Cumpleaños</option>
                <option>Baby shower</option>
                <option>Boda</option>
                <option>Bautizo</option>
                <option>Corporativo</option>
                <option>Otro</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div className="label">Líneas del presupuesto</div>
            <button className="btn btn-ghost btn-sm" onClick={addLine}><I.plus /> Agregar línea</button>
          </div>

          <div className="line-items">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ width: 60 }} className="num">Cant.</th>
                  <th style={{ width: 100 }} className="num">Precio</th>
                  <th style={{ width: 100 }} className="num">Subtotal</th>
                  <th style={{ width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map(l => (
                  <tr key={l.id}>
                    <td>
                      <select className="cell-input" value={l.product}
                        onChange={e => {
                          const p = PRODUCTS.find(p => p.name === e.target.value);
                          updateLine(l.id, { product: e.target.value, price: p ? p.price : l.price });
                        }}>
                        {PRODUCTS.map(p => <option key={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td><input className="cell-input num-input" type="number" min="1" value={l.qty}
                      onChange={e => updateLine(l.id, { qty: +e.target.value || 0 })} /></td>
                    <td><input className="cell-input num-input" type="number" min="0" value={l.price}
                      onChange={e => updateLine(l.id, { price: +e.target.value || 0 })} /></td>
                    <td className="num" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                      {money(l.qty * l.price)}
                    </td>
                    <td>
                      <button onClick={() => removeLine(l.id)} title="Eliminar línea"
                        style={{ background: "transparent", border: 0, color: "var(--ink-muted)", cursor: "pointer", padding: 4 }}>
                        <I.trash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals">
            <div className="row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="row"><span style={{ color: "var(--ink-muted)" }}>IVA (16%)</span><span>{money(tax)}</span></div>
            <div className="row grand"><span>Total</span><span className="v">{money(total)}</span></div>
          </div>

          <div className="field" style={{ marginTop: 22 }}>
            <label>Notas para el cliente</label>
            <textarea className="textarea" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ej. Entrega el 30 de mayo en la mañana. Incluye montaje." />
          </div>
        </div>

        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-secondary" onClick={() => onSaved("Borrador guardado.")}>Guardar borrador</button>
          <button className="btn btn-primary" onClick={() => onSaved(`Presupuesto enviado a ${client || "el cliente"}.`)}>
            <I.send /> Enviar
          </button>
        </div>
      </aside>
    </>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useDState("deni@memydeni.mx");
  const [pwd, setPwd]     = useDState("••••••••");
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand"><img src="../../assets/memydeni-logo.png" alt="MemyDeni" /></div>
        <div className="by">microERP <strong>Presumemi</strong></div>

        <form onSubmit={e => { e.preventDefault(); onLogin(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Correo electrónico</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" value={pwd} onChange={e => setPwd(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ justifyContent: "center", marginTop: 4 }}>
            Entrar a Presumemi <I.arrowRight />
          </button>
          <a href="#" style={{ textAlign: "center", fontSize: 13, marginTop: 4 }}>¿Olvidaste tu contraseña?</a>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { PresupuestoDrawer, LoginScreen });
