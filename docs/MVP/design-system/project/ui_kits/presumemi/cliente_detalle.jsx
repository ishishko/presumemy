/* global React, I, PRESUPUESTOS, CLIENTS, STATUS_TONES, money */
// Pantalla "Detalle de cliente" — full-content takeover (sidebar opaco visible).
// Expone: ClienteDetalleScreen, CLIENTES_RICH, CANAL_OPTIONS, avatarPaletteFor.

const { useState: useCState, useMemo: useCMemo, useRef: useCRef } = React;

/* =========================================================
   Catálogos
   ========================================================= */
const CANAL_OPTIONS = [
  { id: "instagram", label: "Instagram", color: "#D7548C" },
  { id: "whatsapp",  label: "WhatsApp",  color: "#1F8A5B" },
  { id: "mail",      label: "Mail",      color: "#2E6F70" },
  { id: "otros",     label: "Otros",     color: "#6B6270" },
];

/* =========================================================
   Avatar palette — determinístico por nombre
   ========================================================= */
const AVATAR_PALETTE = [
  { bg: "#EAE0F4", ink: "#5C2D54" }, // lavender → violet ink
  { bg: "#D7F2EF", ink: "#1F6864" }, // teal soft → teal ink
  { bg: "#FCE5EB", ink: "#8A2F4A" }, // pink → pink ink
  { bg: "#FFF1C7", ink: "#7A5A00" }, // yellow → mustard
  { bg: "#D0EADD", ink: "#1F5A3E" }, // mint → green ink
  { bg: "#FCEAE4", ink: "#A4361C" }, // coral soft → coral ink
  { bg: "#E2EEFF", ink: "#22497A" }, // sky → navy
  { bg: "#F0E1F0", ink: "#6E2B71" }, // mauve → violet
];

function avatarPaletteFor(name) {
  if (!name) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initialsFor(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/* =========================================================
   Data demo: amplía CLIENTS con código, domicilio, contactos…
   ========================================================= */
const CLIENTES_RICH = (typeof CLIENTS !== "undefined" ? CLIENTS : [
  "Marisol Aguirre", "Laura Domínguez", "Café del Centro", "Pau Hernández",
  "Familia Rojas", "Estudio Pétalo", "Andrea Vázquez", "Iván Castillo",
]).map((name, i) => {
  const handle = name.toLowerCase().replace(/[áä]/g, "a").replace(/[éë]/g, "e")
    .replace(/[íï]/g, "i").replace(/[óö]/g, "o").replace(/[úü]/g, "u")
    .replace(/ñ/g, "n").replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
  const orders = [5, 3, 7, 2, 4, 6, 8, 1][i] || 1;
  const total  = orders * (1800 + i * 360);
  const cities = ["Buenos Aires", "La Plata", "Quilmes", "San Isidro", "Lomas de Zamora", "Tigre", "Vicente López", "Lanús"];
  const provs  = ["CABA", "Buenos Aires", "Buenos Aires", "Buenos Aires", "Buenos Aires", "Buenos Aires", "Buenos Aires", "Buenos Aires"];
  const principalCanal = ["whatsapp", "instagram", "mail", "whatsapp", "whatsapp", "instagram", "mail", "whatsapp"][i % 8];
  const principalVal = {
    whatsapp:  `+54 9 11 5${(1100 + i * 7) % 999}-${1234 + i * 31}`,
    instagram: `@${handle}`,
    mail:      `${handle}@correo.com`,
    otros:     "—",
  }[principalCanal];
  const lastOrders = ["hoy", "ayer", "hace 3 días", "hace 1 semana", "hace 2 semanas", "hace 1 mes", "hace 6 días", "ayer"];

  const contactos = [
    { canal: principalCanal, valor: principalVal,        principal: true  },
  ];
  // Para algunos clientes, agregar contactos secundarios
  if (i % 3 === 0) {
    contactos.push({ canal: "instagram", valor: `@${handle}`, principal: false });
  }
  if (i % 2 === 0) {
    contactos.push({ canal: "mail", valor: `${handle}@correo.com`, principal: false });
  }

  return {
    code: `C-${1001 + i}`,
    name,
    notas: i === 0
      ? "Clienta histórica · pide siempre cumples temáticos. Prefiere paletas pastel."
      : i === 2
      ? "Empresa · facturas A. Coordinar siempre con Lautaro."
      : "",
    activo: true,
    domicilio: {
      calle: ["Av. Cabildo", "Calle 50", "Sarmiento", "Av. Libertador", "Brown", "Av. del Libertador", "Av. Maipú", "9 de Julio"][i % 8],
      numero: String(1200 + i * 137).slice(0, 4),
      piso: i % 3 === 0 ? `${i + 1}° ${["A", "B", "C"][i % 3]}` : "",
      ciudad: cities[i % cities.length],
      provincia: provs[i % provs.length],
      cp: ["C1428", "B1900", "B1878", "B1642", "B1832", "B1648", "B1638", "B1824"][i % 8],
      pais: "Argentina",
      referencia: i % 4 === 0 ? "Timbre 3 · portero eléctrico nuevo" : "",
    },
    contactos,
    lastOrder: lastOrders[i % lastOrders.length],
    ordersCount: orders,
    totalFacturado: total,
    principalCanal,
    principalCanalVal: principalVal,
  };
});

/* =========================================================
   Helper: historial de presupuestos por cliente
   ========================================================= */
function historialFor(name) {
  if (typeof PRESUPUESTOS === "undefined") return [];
  return PRESUPUESTOS.filter((p) => p.client === name);
}

const newCId = (() => { let i = 0; return () => ++i; })();

/* =========================================================
   Componente principal
   ========================================================= */
function ClienteDetalleScreen({ cliente, onBack, onSaved, onDeleted, onOpenPresupuesto }) {
  const seed = cliente || CLIENTES_RICH[0];

  // ----- estado del formulario -----
  const [nombre, setNombre]   = useCState(seed.name);
  const [notas, setNotas]     = useCState(seed.notas || "");
  const [activo, setActivo]   = useCState(seed.activo !== false);

  const [calle, setCalle]           = useCState(seed.domicilio?.calle || "");
  const [numero, setNumero]         = useCState(seed.domicilio?.numero || "");
  const [piso, setPiso]             = useCState(seed.domicilio?.piso || "");
  const [ciudad, setCiudad]         = useCState(seed.domicilio?.ciudad || "");
  const [provincia, setProvincia]   = useCState(seed.domicilio?.provincia || "");
  const [cp, setCp]                 = useCState(seed.domicilio?.cp || "");
  const [pais, setPais]             = useCState(seed.domicilio?.pais || "Argentina");
  const [referencia, setReferencia] = useCState(seed.domicilio?.referencia || "");

  const initialContactos = useCMemo(
    () => (seed.contactos && seed.contactos.length
      ? seed.contactos
      : [{ canal: "whatsapp", valor: "", principal: true }]
    ).map((c) => ({ ...c, id: newCId() })),
    [seed]
  );
  const [contactos, setContactos] = useCState(initialContactos);
  const MAX_CONTACTOS = 5;

  // ----- comportamiento spreadsheet de contactos -----
  const [activeRow, setActiveRow]       = useCState(null);
  const [dragId,    setDragId]          = useCState(null);
  const [dragOverId, setDragOverId]     = useCState(null);
  const contactosTableRef = useCRef(null);

  // ----- modales de confirmación + animación de salida -----
  const [confirmExit, setConfirmExit] = useCState(false);
  const [confirmDel,  setConfirmDel]  = useCState(false);
  const [closing,     setClosing]     = useCState(false);

  // Snapshot inicial
  const initialRef = useCRef({
    nombre: seed.name, notas: seed.notas || "", activo: seed.activo !== false,
    calle: seed.domicilio?.calle || "",
    numero: seed.domicilio?.numero || "",
    piso: seed.domicilio?.piso || "",
    ciudad: seed.domicilio?.ciudad || "",
    provincia: seed.domicilio?.provincia || "",
    cp: seed.domicilio?.cp || "",
    pais: seed.domicilio?.pais || "Argentina",
    referencia: seed.domicilio?.referencia || "",
    contactos: JSON.stringify(initialContactos.map(({ id, ...r }) => r)),
  });

  /* ----- dirty ----- */
  const dirty = useCMemo(() => {
    const i = initialRef.current;
    return (
      nombre !== i.nombre ||
      notas !== i.notas ||
      activo !== i.activo ||
      calle !== i.calle ||
      numero !== i.numero ||
      piso !== i.piso ||
      ciudad !== i.ciudad ||
      provincia !== i.provincia ||
      cp !== i.cp ||
      pais !== i.pais ||
      referencia !== i.referencia ||
      JSON.stringify(contactos.map(({ id, ...r }) => r)) !== i.contactos
    );
  }, [nombre, notas, activo, calle, numero, piso, ciudad, provincia, cp, pais, referencia, contactos]);

  /* ----- avatar ----- */
  const palette = avatarPaletteFor(nombre);
  const initials = initialsFor(nombre);

  /* ----- historial ----- */
  const historial = useCMemo(() => historialFor(seed.name), [seed.name]);

  /* =========================================================
     Contactos helpers
     ========================================================= */
  const updateContacto = (id, patch) =>
    setContactos((ls) => ls.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeContacto = (id) =>
    setContactos((ls) => {
      const next = ls.filter((c) => c.id !== id);
      if (next.length === 0) return [{ id: newCId(), canal: "whatsapp", valor: "", principal: true }];
      if (!next.some((c) => c.principal)) next[0].principal = true;
      return next;
    });
  const addContacto = () =>
    setContactos((ls) => {
      if (ls.length >= MAX_CONTACTOS) return ls;
      return [...ls, { id: newCId(), canal: "whatsapp", valor: "", principal: false }];
    });
  const setPrincipal = (id) =>
    setContactos((ls) => ls.map((c) => ({ ...c, principal: c.id === id })));
  const onContactosDrop = (id) => {
    if (dragId == null || dragId === id) { setDragId(null); setDragOverId(null); return; }
    setContactos((ls) => {
      const from = ls.findIndex((c) => c.id === dragId);
      const to   = ls.findIndex((c) => c.id === id);
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
    const principal = contactos.find((c) => c.principal) || contactos[0];
    initialRef.current = {
      nombre, notas, activo, calle, numero, piso, ciudad, provincia, cp, pais, referencia,
      contactos: JSON.stringify(contactos.map(({ id, ...r }) => r)),
    };
    onSaved && onSaved({
      code: seed.code,
      name: nombre,
      notas, activo,
      domicilio: { calle, numero, piso, ciudad, provincia, cp, pais, referencia },
      contactos: contactos.map(({ id, ...r }) => r),
      principalCanal: principal?.canal,
      principalCanalVal: principal?.valor,
      ordersCount: seed.ordersCount,
      totalFacturado: seed.totalFacturado,
      lastOrder: seed.lastOrder,
    });
  };
  const handleDelete = () => onDeleted && onDeleted(seed);

  /* =========================================================
     Render
     ========================================================= */
  return (
    <div
      className={"cd-overlay" + (closing ? " closing" : "")}
      data-screen-label="Detalle de cliente"
    >
      <ClienteDetalleStyles />

      {/* HEAD */}
      <div className="cd-head">
        <button className="icon-btn" onClick={handleBack} title="Volver a clientes">
          <I.back />
        </button>
        <div className="cd-title">
          <span className="eyebrow">
            Cliente <span className="code">· {seed.code}</span>
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
      <div className="cd-body">
        <div className="cd-top">

          {/* ============ Columna 1: Identidad ============ */}
          <section className="cd-card">
            <div className="cd-card-head">
              <h4>Identidad</h4>
              <span className="cd-code-badge" title="Código autogenerado, solo lectura">
                <LockIconC /> {seed.code}
              </span>
            </div>

            <div className="cd-identity-block">
              <div
                className="cd-avatar"
                style={{ background: palette.bg, color: palette.ink }}
                aria-hidden="true"
              >{initials}</div>
              <div className="cd-identity-fields">
                <div className="cd-field">
                  <label>Nombre</label>
                  <input
                    className="cd-inline-name"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="cd-summary-stats">
                  <div className="stat">
                    <span className="num">{seed.ordersCount || 0}</span>
                    <span className="lbl">Pedidos</span>
                  </div>
                  <div className="stat">
                    <span className="num">{money(seed.totalFacturado || 0)}</span>
                    <span className="lbl">Total facturado</span>
                  </div>
                  <div className="stat">
                    <span className="num">{seed.lastOrder || "—"}</span>
                    <span className="lbl">Último pedido</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="cd-field">
              <label>Notas</label>
              <textarea
                className="textarea"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Información interna · preferencias, observaciones, recordatorios"
              />
            </div>

            <div className="cd-toggle-row">
              <div className="lbl">
                <span className="t">Cliente activo</span>
                <span className="h">Visible en búsquedas y presupuestos.</span>
              </div>
              <div
                role="switch"
                aria-checked={activo}
                tabIndex={0}
                className={"cd-switch" + (activo ? " on" : "")}
                onClick={() => setActivo((v) => !v)}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setActivo((v) => !v); } }}
              />
            </div>
          </section>

          {/* ============ Columna 2: Domicilio ============ */}
          <section className="cd-card">
            <div className="cd-card-head">
              <h4>Domicilio</h4>
              <span className="cd-hint">Pre-completa el envío en presupuestos</span>
            </div>

            <div className="cd-domicilio-grid">
              <div className="cd-field" style={{ gridColumn: "1 / span 2" }}>
                <label>Calle</label>
                <input
                  className="input"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  placeholder="Ej. Av. Cabildo"
                />
              </div>
              <div className="cd-field">
                <label>Número</label>
                <input
                  className="input"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="2345"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
              </div>

              <div className="cd-field" style={{ gridColumn: "1 / span 2" }}>
                <label>Piso / Depto <span className="optional">(opcional)</span></label>
                <input
                  className="input"
                  value={piso}
                  onChange={(e) => setPiso(e.target.value)}
                  placeholder="3° B"
                />
              </div>
              <div className="cd-field">
                <label>Código postal</label>
                <input
                  className="input"
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  placeholder="C1428"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
              </div>

              <div className="cd-field">
                <label>Ciudad</label>
                <input
                  className="input"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Buenos Aires"
                />
              </div>
              <div className="cd-field">
                <label>Provincia</label>
                <input
                  className="input"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  placeholder="CABA"
                />
              </div>
              <div className="cd-field">
                <label>País</label>
                <input
                  className="input"
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  placeholder="Argentina"
                />
              </div>

              <div className="cd-field" style={{ gridColumn: "1 / -1" }}>
                <label>Referencia <span className="optional">(opcional)</span></label>
                <input
                  className="input"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Timbre 3 · portero eléctrico, entrada por el frente"
                />
              </div>
            </div>
          </section>
        </div>

        {/* ============ Canales de contacto ============ */}
        <section className="cd-prov-card">
          <div className="head">
            <h4>Canales de contacto</h4>
            <span className="hint">Hasta {MAX_CONTACTOS} contactos · marcá uno como principal</span>
          </div>

          <div ref={contactosTableRef} tabIndex={-1} className="cd-prov-table">
            <table>
              <colgroup>
                <col style={{ width: 28 }} />
                <col style={{ width: 160 }} />
                <col />
                <col style={{ width: 100 }} />
                <col style={{ width: 44 }} />
              </colgroup>
              <thead>
                <tr>
                  <th></th>
                  <th>Canal</th>
                  <th>Valor</th>
                  <th className="center">Principal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contactos.map((c) => {
                  const opt = CANAL_OPTIONS.find((o) => o.id === c.canal) || CANAL_OPTIONS[0];
                  return (
                    <tr
                      key={c.id}
                      className={[
                        activeRow === c.id && "active",
                        dragId === c.id && "dragging",
                        dragOverId === c.id && dragId !== c.id && "drag-over",
                      ].filter(Boolean).join(" ")}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverId(c.id); }}
                      onDrop={() => onContactosDrop(c.id)}
                      onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                    >
                      <td className="center">
                        <span className="grip" title="Arrastrar para reordenar"><I.grip /></span>
                      </td>
                      <td>
                        <div className="cd-canal-cell">
                          <span className="cd-canal-dot" style={{ background: opt.color }} />
                          <select
                            className="prov-input"
                            value={c.canal}
                            onChange={(e) => updateContacto(c.id, { canal: e.target.value })}
                            onFocus={() => setActiveRow(c.id)}
                            style={{ paddingLeft: 4 }}
                          >
                            {CANAL_OPTIONS.map((o) => (
                              <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <input
                          className="prov-input"
                          value={c.valor}
                          placeholder={
                            c.canal === "instagram" ? "@usuario"
                            : c.canal === "whatsapp" ? "+54 9 11 5555-1234"
                            : c.canal === "mail" ? "nombre@correo.com"
                            : "Detalle del contacto…"
                          }
                          onChange={(e) => updateContacto(c.id, { valor: e.target.value })}
                          onFocus={() => setActiveRow(c.id)}
                        />
                      </td>
                      <td className="center">
                        <button
                          type="button"
                          className={"cd-radio" + (c.principal ? " checked" : "")}
                          aria-checked={c.principal}
                          role="radio"
                          onClick={() => setPrincipal(c.id)}
                          title={c.principal ? "Contacto principal" : "Marcar como principal"}
                        />
                      </td>
                      <td>
                        <button
                          className="cd-prov-del"
                          onClick={() => removeContacto(c.id)}
                          title="Eliminar contacto"
                        ><I.trash /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            className="cd-prov-add"
            onClick={addContacto}
            disabled={contactos.length >= MAX_CONTACTOS}
          >
            <I.plus /> Agregar contacto {contactos.length >= MAX_CONTACTOS && `· máx ${MAX_CONTACTOS}`}
          </button>
        </section>

        {/* ============ Historial de presupuestos ============ */}
        <section className="cd-prov-card">
          <div className="head">
            <h4>Historial de presupuestos</h4>
            <span className="hint">{historial.length} presupuestos · click para ver detalle</span>
          </div>

          {historial.length === 0 ? (
            <div className="cd-empty">Aún no hay presupuestos para este cliente.</div>
          ) : (
            <div className="table-wrap" style={{ borderRadius: 10 }}>
              <table className="data-table cd-historial">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Folio</th>
                    <th>Evento</th>
                    <th style={{ width: 110 }}>Fecha</th>
                    <th style={{ width: 130 }}>Estado</th>
                    <th className="num" style={{ width: 140 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((p) => {
                    const s = (typeof STATUS_TONES !== "undefined" && STATUS_TONES[p.status])
                      || { tone: "default", label: p.status };
                    return (
                      <tr
                        key={p.folio}
                        onClick={() => onOpenPresupuesto && onOpenPresupuesto(p.folio)}
                        title="Ver presupuesto"
                        style={{ cursor: "pointer" }}
                      >
                        <td className="cd-folio-cell">{p.folio}</td>
                        <td>{p.event}</td>
                        <td style={{ color: "var(--ink-muted)" }}>{p.date}</td>
                        <td>
                          <span className={"badge " + s.tone}>
                            <span className="dot" /> {s.label}
                          </span>
                        </td>
                        <td className="num" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                          {money(p.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* FOOT */}
      <div className="cd-foot">
        <button className="cd-back-btn" onClick={handleBack}>
          <I.back /> Volver a clientes
        </button>
        <div className="spacer" />
        <button className="btn btn-danger" onClick={() => setConfirmDel(true)}>
          <I.trash /> Eliminar cliente
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!dirty}
          style={{ opacity: dirty ? 1 : 0.5, pointerEvents: dirty ? "auto" : "none" }}
        ><I.check /> Guardar cambios</button>
      </div>

      {/* Confirm: salir sin guardar */}
      {confirmExit && (
        <div className="cd-confirm-mask" onClick={() => setConfirmExit(false)}>
          <div className="cd-confirm" onClick={(e) => e.stopPropagation()}>
            <h4>¿Salir sin guardar?</h4>
            <p>Tenés cambios pendientes en <strong>{seed.code} · {nombre}</strong>. Si salís ahora, vas a perderlos.</p>
            <div className="cd-confirm-actions">
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
        <div className="cd-confirm-mask" onClick={() => setConfirmDel(false)}>
          <div className="cd-confirm" onClick={(e) => e.stopPropagation()}>
            <h4>Eliminar cliente</h4>
            <p>Vas a eliminar <strong>{seed.code} · {nombre}</strong>. El historial de presupuestos no se borra, pero el cliente deja de aparecer en búsquedas.</p>
            <div className="cd-confirm-actions">
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

/* =========================================================
   Estilos (auto-inyectados — solo viven mientras el overlay
   está montado, por lo que no hay race con el FOUC)
   ========================================================= */
function ClienteDetalleStyles() {
  return (
    <style>{`
      .cd-overlay {
        position: fixed;
        top: 0; right: 0; bottom: 0; left: 240px;
        z-index: 30;
        background: var(--page-bg);
        opacity: 1;
        display: grid;
        grid-template-rows: auto 1fr auto;
        min-height: 0;
        animation: cd-slide-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        overflow: hidden;
      }
      .cd-overlay.closing {
        animation: cd-slide-out 200ms cubic-bezier(0.4, 0, 1, 1) both;
        pointer-events: none;
      }
      @keyframes cd-slide-in {
        from { transform: translateY(6px); }
        to   { transform: translateY(0); }
      }
      @keyframes cd-slide-out {
        from { transform: translateY(0); }
        to   { transform: translateY(4px); }
      }

      .cd-head {
        display: flex; align-items: center; gap: 14px;
        padding: 18px 28px;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
      }
      .cd-title { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
      .cd-title .eyebrow {
        font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
        color: var(--ink-muted); font-weight: 500;
        display: flex; align-items: center; gap: 8px;
      }
      .cd-title .eyebrow .code {
        color: var(--violet-700);
        font-family: var(--font-mono);
      }
      .cd-title h2 { font-size: 22px; line-height: 1.1; margin: 0; }
      .cd-head .dirty-chip {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 12px; padding: 6px 12px;
        background: var(--yellow); color: var(--yellow-ink);
        border-radius: 999px;
      }
      .cd-head .dirty-chip .dot {
        width: 6px; height: 6px; border-radius: 50%; background: var(--yellow-ink);
      }

      .cd-body {
        overflow-y: auto;
        padding: 28px;
        display: flex; flex-direction: column; gap: 24px;
      }
      .cd-top {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        align-items: start;
      }

      .cd-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: 20px;
        box-shadow: var(--shadow-1);
        display: flex; flex-direction: column; gap: 16px;
      }
      .cd-card-head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
      }
      .cd-card-head h4 {
        font-size: 11px; color: var(--ink-muted); font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
        margin: 0;
      }
      .cd-hint {
        font-size: 11px; color: var(--ink-muted);
      }

      /* Identity block */
      .cd-identity-block {
        display: flex; gap: 16px; align-items: stretch;
      }
      .cd-avatar {
        width: 88px; height: 88px;
        flex-shrink: 0;
        border-radius: 22px;
        font-family: var(--font-sans);
        font-size: 32px; font-weight: 500;
        letter-spacing: -0.02em;
        display: grid; place-items: center;
        user-select: none;
      }
      .cd-identity-fields {
        flex: 1; min-width: 0;
        display: flex; flex-direction: column; gap: 12px;
      }
      .cd-summary-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .cd-summary-stats .stat {
        display: flex; flex-direction: column; gap: 2px;
        padding: 6px 0;
      }
      .cd-summary-stats .stat .num {
        font-size: 15px; font-weight: 500; color: var(--ink);
        font-variant-numeric: tabular-nums; letter-spacing: -0.005em;
      }
      .cd-summary-stats .stat .lbl {
        font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted);
      }

      .cd-field { display: flex; flex-direction: column; gap: 6px; }
      .cd-field > label {
        font-size: 11px; font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted);
      }
      .cd-field > label .optional {
        font-size: 10px; color: var(--ink-muted);
        font-weight: 400; text-transform: lowercase; letter-spacing: 0;
        margin-left: 4px;
      }
      .cd-inline-name {
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
      .cd-inline-name:hover { background: var(--violet-50); }
      .cd-inline-name:focus {
        outline: none; background: var(--surface);
        box-shadow: var(--focus-ring);
      }
      .cd-code-badge {
        display: inline-flex; align-items: center; gap: 6px;
        font-family: var(--font-mono);
        font-size: 12px;
        padding: 3px 10px;
        background: var(--violet-100); color: var(--violet-700);
        border-radius: 999px;
        cursor: default; user-select: text;
      }
      .cd-code-badge .lock { width: 10px; height: 10px; opacity: 0.7; }

      .cd-domicilio-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }

      .cd-toggle-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 0 0;
        border-top: 1px solid var(--border);
        gap: 12px;
      }
      .cd-toggle-row .lbl { display: flex; flex-direction: column; gap: 2px; }
      .cd-toggle-row .lbl .t { font-size: 13px; font-weight: 500; color: var(--ink); }
      .cd-toggle-row .lbl .h { font-size: 12px; color: var(--ink-muted); }
      .cd-switch {
        position: relative;
        width: 36px; height: 20px;
        border-radius: 999px;
        background: var(--border-strong);
        cursor: pointer;
        transition: background 120ms ease;
        flex-shrink: 0;
      }
      .cd-switch::after {
        content: "";
        position: absolute; top: 2px; left: 2px;
        width: 16px; height: 16px;
        background: var(--surface);
        border-radius: 50%;
        transition: transform 140ms cubic-bezier(0.2,0.8,0.2,1);
        box-shadow: 0 1px 2px rgba(0,0,0,0.18);
      }
      .cd-switch.on { background: var(--teal-500); }
      .cd-switch.on::after { transform: translateX(16px); }

      /* Contactos spreadsheet */
      .cd-prov-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-1);
        padding: 20px;
        display: flex; flex-direction: column; gap: 14px;
      }
      .cd-prov-card .head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
      }
      .cd-prov-card .head h4 { font-size: 16px; color: var(--ink); font-weight: 500; }
      .cd-prov-card .head .hint { font-size: 12px; color: var(--ink-muted); }

      .cd-prov-table {
        border: 1px solid var(--border-strong);
        border-radius: 10px;
        background: var(--surface);
        overflow: hidden;
      }
      .cd-prov-table table { width: 100%; border-collapse: collapse; }
      .cd-prov-table thead th {
        text-align: left;
        padding: 10px 12px;
        font-size: 11px; font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted);
        background: var(--page-bg);
        border-bottom: 1px solid var(--border);
      }
      .cd-prov-table thead th.center { text-align: center; }
      .cd-prov-table tbody td {
        padding: 0;
        border-bottom: 1px solid var(--border);
      }
      .cd-prov-table tbody tr:last-child td { border-bottom: 0; }
      .cd-prov-table tbody td.center { text-align: center; padding: 8px; }
      .cd-prov-table tbody td .grip { padding: 8px; color: var(--ink-muted); cursor: grab; }
      .cd-prov-table tbody tr.dragging td { opacity: 0.5; }
      .cd-prov-table tbody tr.drag-over td { box-shadow: inset 0 2px 0 0 var(--violet-700); }

      .cd-prov-table .prov-input {
        width: 100%;
        border: 0; background: transparent;
        font-family: var(--font-sans); font-size: 13px;
        color: var(--ink);
        padding: 11px 12px;
        outline: none;
      }
      .cd-prov-table .prov-input:focus { background: var(--teal-100); }

      .cd-canal-cell {
        display: flex; align-items: center; gap: 8px;
        padding-left: 10px;
      }
      .cd-canal-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .cd-radio {
        width: 18px; height: 18px;
        border-radius: 50%;
        border: 1.5px solid var(--border-strong);
        background: var(--surface);
        cursor: pointer;
        display: inline-grid; place-items: center;
        position: relative;
        transition: border-color 120ms ease;
      }
      .cd-radio:hover { border-color: var(--violet-700); }
      .cd-radio.checked { border-color: var(--violet-700); }
      .cd-radio.checked::after {
        content: "";
        width: 9px; height: 9px; border-radius: 50%;
        background: var(--violet-700);
      }

      .cd-prov-del {
        background: transparent; border: 0;
        width: 28px; height: 28px;
        display: inline-grid; place-items: center;
        border-radius: 6px;
        color: var(--ink-muted); cursor: pointer;
        transition: background 120ms ease, color 120ms ease;
      }
      .cd-prov-del:hover { color: var(--coral-500); background: var(--coral-50); }
      .cd-prov-del svg { width: 14px; height: 14px; }

      .cd-prov-add {
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
      .cd-prov-add:hover { background: var(--violet-50); border-color: var(--violet-700); }
      .cd-prov-add:disabled { opacity: 0.5; pointer-events: none; }
      .cd-prov-add svg { width: 14px; height: 14px; }

      /* Historial */
      .cd-historial tbody tr:hover td { background: var(--page-bg); }
      .cd-historial tbody td.cd-folio-cell {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--violet-700);
        font-weight: 500;
      }
      .cd-empty {
        background: var(--page-bg);
        border: 1px dashed var(--border-strong);
        border-radius: var(--r-md);
        padding: 32px;
        text-align: center;
        color: var(--ink-muted);
        font-size: 13px;
      }

      /* Action bar */
      .cd-foot {
        display: flex; align-items: center; gap: 10px;
        padding: 14px 28px;
        background: var(--surface);
        border-top: 1px solid var(--border);
      }
      .cd-foot .spacer { flex: 1; }
      .cd-back-btn {
        font-family: var(--font-sans); font-size: 14px; font-weight: 500;
        padding: 9px 14px;
        border-radius: 8px;
        border: 1px solid transparent;
        cursor: pointer;
        display: inline-flex; align-items: center; gap: 8px;
        background: transparent; color: var(--violet-700);
        transition: background 120ms ease;
      }
      .cd-back-btn:hover { background: var(--violet-50); }
      .cd-back-btn svg { width: 16px; height: 16px; }

      /* Confirm modals */
      .cd-confirm-mask {
        position: absolute; inset: 0;
        background: rgba(28, 26, 30, 0.30);
        display: grid; place-items: center;
        z-index: 4;
        animation: cd-mask-in 140ms ease both;
      }
      @keyframes cd-mask-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .cd-confirm {
        background: var(--surface);
        border-radius: var(--r-lg);
        padding: 22px;
        width: 400px;
        box-shadow: 0 12px 32px rgba(28,26,30,0.18);
        display: flex; flex-direction: column; gap: 14px;
        border: 1px solid var(--border);
      }
      .cd-confirm h4 { font-size: 17px; font-weight: 500; color: var(--ink); margin: 0; }
      .cd-confirm p { font-size: 13px; color: var(--ink-muted); margin: 0; line-height: 1.45; }
      .cd-confirm-actions {
        display: flex; gap: 8px; justify-content: flex-end;
      }
    `}</style>
  );
}

function LockIconC() {
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
  ClienteDetalleScreen,
  CLIENTES_RICH,
  CANAL_OPTIONS,
  avatarPaletteFor,
  initialsFor,
  historialFor,
});
