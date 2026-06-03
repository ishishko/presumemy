/* global React, I, Card, Badge, PageHead, money, moneyShort, PRESUPUESTOS, PRODUCTS, INSUMOS, INSUMOS_RICH, INSUMO_CATEGORIES, CLIENTS, CLIENTES_RICH, CANAL_OPTIONS, avatarPaletteFor, initialsFor, STATUS_TONES, computeNivel, NIVEL_META, MOVIMIENTOS, IMPRENTA_ORDENES, TIPO_MOVIMIENTOS, TIPO_BADGE_TONE, CUENTAS, METODOS_PAGO, fmtFechaMov, signedMoney */
const { useState, useMemo } = React;

/* ====================== PRESUPUESTOS LIST ====================== */
function PresupuestosScreen({ onOpen }) {
  const [filter, setFilter] = useState("todos");
  const filters = [
    { id: "todos",     label: "Todos"     },
    { id: "borrador",  label: "Borrador"  },
    { id: "enviado",   label: "Enviado"   },
    { id: "pendiente", label: "Pendiente" },
    { id: "pagado",    label: "Pagado"    },
    { id: "vencido",   label: "Vencido"   },
  ];
  const rows = useMemo(
    () => filter === "todos" ? PRESUPUESTOS : PRESUPUESTOS.filter(p => p.status === filter),
    [filter]
  );

  return (
    <>
      <PageHead title="Presupuestos" sub={`${PRESUPUESTOS.length} en total · ${PRESUPUESTOS.filter(p => p.status === "pendiente" || p.status === "enviado").length} esperando respuesta`}>
        <button className="btn btn-secondary"><I.download /> Exportar</button>
        <button className="btn btn-primary" onClick={() => onOpen(null)}>
          <I.plus /> Nuevo presupuesto
        </button>
      </PageHead>

      <div className="table-wrap">
        <div className="table-toolbar">
          {filters.map(f => (
            <button
              key={f.id}
              className={"filter-chip" + (filter === f.id ? " active" : "")}
              onClick={() => setFilter(f.id)}
            >{f.label}</button>
          ))}
          <div className="spacer"></div>
          <button className="btn btn-secondary btn-sm"><I.filter /> Filtros</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Evento</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th className="num">Total</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              const s = STATUS_TONES[p.status];
              return (
                <tr key={p.folio} onClick={() => onOpen(p.folio)}>
                  <td style={{ color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>{p.folio}</td>
                  <td style={{ fontWeight: 500 }}>{p.client}</td>
                  <td><Badge tone="lavender">{p.event}</Badge></td>
                  <td style={{ color: "var(--ink-muted)" }}>{p.date}</td>
                  <td><Badge tone={s.tone} dot>{s.label}</Badge></td>
                  <td className="num" style={{ fontWeight: 500 }}>{money(p.total)}</td>
                  <td><button className="icon-btn" style={{ width: 28, height: 28, border: "0", background: "transparent" }} onClick={e => e.stopPropagation()}><I.more /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ====================== CATÁLOGO ====================== */
function CatalogoScreen() {
  const [cat, setCat] = useState("todos");
  const cats = ["todos", "Decoración", "Mesa", "Repostería", "Empaque"];
  const items = cat === "todos" ? PRODUCTS : PRODUCTS.filter(p => p.cat === cat);

  return (
    <>
      <PageHead title="Catálogo" sub={`${PRODUCTS.length} productos · 4 categorías`}>
        <button className="btn btn-secondary"><I.filter /> Categorías</button>
        <button className="btn btn-primary"><I.plus /> Nuevo producto</button>
      </PageHead>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {cats.map(c => (
          <button
            key={c}
            className={"filter-chip" + (cat === c ? " active" : "")}
            onClick={() => setCat(c)}
            style={{ textTransform: c === "todos" ? "capitalize" : "none" }}
          >{c}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {items.map(p => (
          <div key={p.id} className="product-card">
            <div className="product-thumb" style={{
              background: `var(--${p.tone === "lavender" ? "lavender" :
                                   p.tone === "mint" ? "mint" :
                                   p.tone === "pink" ? "pink-soft" :
                                   p.tone === "yellow" ? "yellow" : "page-bg"})`,
              borderColor: "transparent",
              color: p.tone === "yellow" ? "var(--yellow-ink)" : "var(--ink)",
              opacity: 0.95
            }}>foto producto</div>
            <div>
              <div className="name">{p.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{p.cat} · {p.id}</div>
            </div>
            <div className="meta">
              <span>Stock: <strong>{p.stock}</strong></span>
              <strong>{money(p.price)}</strong>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ====================== INSUMOS ====================== */
function InsumosScreen({ onCreate, onOpenDetail }) {
  const items = (typeof INSUMOS_RICH !== "undefined" && INSUMOS_RICH) || INSUMOS;
  const cats  = (typeof INSUMO_CATEGORIES !== "undefined" && INSUMO_CATEGORIES) || [];
  const nivelFn = (typeof computeNivel === "function")
    ? computeNivel
    : (i) => (i.stock < i.min * 0.5 ? "critico" : i.stock < i.min ? "bajo" : "ok");

  const [stateFilter, setStateFilter] = useState("todos");
  const [catFilter,   setCatFilter]   = useState("todas");

  const counts = useMemo(() => {
    const c = { critico: 0, bajo: 0, ok: 0 };
    items.forEach((i) => { c[nivelFn(i)]++; });
    return c;
  }, [items]);

  const filtered = useMemo(() => items.filter((i) => {
    if (stateFilter !== "todos" && nivelFn(i) !== stateFilter) return false;
    if (catFilter   !== "todas" && i.cat !== catFilter)         return false;
    return true;
  }), [items, stateFilter, catFilter]);

  const stateChips = [
    { id: "todos",   label: "Todos",    count: items.length },
    { id: "critico", label: "Crítico",  count: counts.critico, dot: "#EA5F3C" },
    { id: "bajo",    label: "Bajo",     count: counts.bajo,    dot: "#F8D132" },
    { id: "ok",      label: "OK",       count: counts.ok,      dot: "#75CCCE" },
  ];

  return (
    <>
      <PageHead
        title="Insumos"
        sub={`${items.length} materiales · ${counts.critico} críticos · ${counts.bajo} bajos`}
      >
        <button className="btn btn-secondary"><I.download /> Exportar</button>
        <button className="btn btn-primary" onClick={onCreate}><I.plus /> Agregar insumo</button>
      </PageHead>

      {/* Pills de estado */}
      <div className="insumos-filter-row">
        {stateChips.map((s) => (
          <button
            key={s.id}
            className={"insumos-state-pill" + (stateFilter === s.id ? " active" : "")}
            onClick={() => setStateFilter(s.id)}
          >
            {s.dot && <span className="d" style={{ background: s.dot }} />}
            {s.label}
            <span className="k">{s.count}</span>
          </button>
        ))}
      </div>

      {/* Pills de categoría */}
      <div className="insumos-cat-row">
        <button
          className={"insumos-cat-pill" + (catFilter === "todas" ? " active" : "")}
          onClick={() => setCatFilter("todas")}
        >Todas</button>
        {cats.map((c) => (
          <button
            key={c}
            className={"insumos-cat-pill" + (catFilter === c ? " active" : "")}
            onClick={() => setCatFilter(c)}
          >{c}</button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table insumos-table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Categoría</th>
              <th className="num">Stock</th>
              <th className="num">Mínimo</th>
              <th className="num">Costo unitario</th>
              <th>Proveedor principal</th>
              <th style={{ width: 160 }}>Nivel</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const sev = nivelFn(i);
              const meta = (typeof NIVEL_META !== "undefined" && NIVEL_META[sev])
                || { label: sev, color: "#888", bg: "#eee", barClass: sev === "critico" ? "low" : sev === "bajo" ? "warn" : "ok" };
              const pct = Math.min(100, ((parseFloat(i.stock) || 0) / Math.max(parseFloat(i.min), 1)) * 100);
              const costUnit = (i.costoPaquete && i.cantidadPack)
                ? i.costoPaquete / i.cantidadPack
                : null;
              return (
                <tr
                  key={i.code || i.name}
                  onDoubleClick={() => onOpenDetail && onOpenDetail(i)}
                  title="Doble click para ver detalle"
                >
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span>{i.name}</span>
                      {i.code && (
                        <span style={{ fontSize: 11, color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>{i.code}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: "var(--ink-muted)" }}>{i.cat}</td>
                  <td className="num" style={{ fontWeight: 500 }}>
                    {i.stock} <span style={{ color: "var(--ink-muted)", fontSize: 12, fontWeight: 400 }}>{i.unit}</span>
                  </td>
                  <td className="num" style={{ color: "var(--ink-muted)" }}>
                    {i.min} <span style={{ fontSize: 12 }}>{i.unit}</span>
                  </td>
                  <td className="num" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {costUnit != null ? money(costUnit) : <span style={{ color: "var(--ink-muted)" }}>—</span>}
                  </td>
                  <td style={{ color: "var(--ink-muted)" }}>
                    {i.proveedorPrincipal || <span style={{ opacity: 0.6 }}>—</span>}
                  </td>
                  <td>
                    <div className={"stock-bar " + meta.barClass}>
                      <div style={{ width: pct + "%" }}></div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="insumos-state-badge"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      <span className="d" /> {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: "center", color: "var(--ink-muted)", padding: "24px 0" }}>
                Sin resultados con los filtros actuales.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ====================== FINANZAS ====================== */
function FinanzasScreen({
  movimientos,
  imprentaOrdenes,
  onCreateMovimiento,
  onOpenMovimiento,
  onCreateImprenta,
  onOpenImprenta,
}) {
  const movs = movimientos || (typeof MOVIMIENTOS !== "undefined" ? MOVIMIENTOS : []);
  const ords = imprentaOrdenes || (typeof IMPRENTA_ORDENES !== "undefined" ? IMPRENTA_ORDENES : []);
  const tipos = (typeof TIPO_MOVIMIENTOS !== "undefined" ? TIPO_MOVIMIENTOS : []);
  const tipoBadge = (typeof TIPO_BADGE_TONE !== "undefined" ? TIPO_BADGE_TONE : {});
  const cuentas = (typeof CUENTAS !== "undefined" ? CUENTAS : []);
  const metodos = (typeof METODOS_PAGO !== "undefined" ? METODOS_PAGO : []);
  const fmt = (typeof fmtFechaMov === "function")
    ? fmtFechaMov
    : (iso) => iso;
  const signed = (typeof signedMoney === "function")
    ? signedMoney
    : (n) => (n >= 0 ? "+ " : "− ") + Math.abs(n);

  const [tab, setTab]                   = useState("movimientos");
  const [tipoFilter, setTipoFilter]     = useState("todos");
  const [cuentaFilter, setCuentaFilter] = useState("todas");
  const [period, setPeriod]             = useState({ year: 2026, month: 4 }); // 0-indexed: 4 = mayo

  const MES_LONG = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const periodLabel = `${MES_LONG[period.month]} ${period.year}`;
  const shiftPeriod = (delta) => {
    setPeriod((p) => {
      let m = p.month + delta;
      let y = p.year;
      if (m < 0)  { m = 11; y -= 1; }
      if (m > 11) { m = 0;  y += 1; }
      return { year: y, month: m };
    });
  };

  /* ---------- KPIs ---------- */
  const ingresos = useMemo(() => movs.filter((m) => m.monto > 0).reduce((s, m) => s + m.monto, 0), [movs]);
  const egresos  = useMemo(() => movs.filter((m) => m.monto < 0).reduce((s, m) => s + Math.abs(m.monto), 0), [movs]);
  const utilidad = ingresos - egresos;
  const margen   = ingresos > 0 ? Math.round((utilidad / ingresos) * 100) : 0;

  /* ---------- Movimientos filtered ---------- */
  const movsFiltered = useMemo(() => movs.filter((m) => {
    if (tipoFilter   !== "todos" && m.tipo   !== tipoFilter)   return false;
    if (cuentaFilter !== "todas" && m.cuenta !== cuentaFilter) return false;
    return true;
  }), [movs, tipoFilter, cuentaFilter]);

  /* ---------- Tab counts ---------- */
  const movCount = movs.length;
  const ordCount = ords.length;

  return (
    <>
      <PageHead title="Finanzas" sub={`${periodLabel} · ${movCount} movimientos · ${ordCount} órdenes de imprenta`}>
        <div className="fin-period" role="group" aria-label="Período">
          <button onClick={() => shiftPeriod(-1)} title="Mes anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="label"><I.calendar /> {periodLabel}</span>
          <button onClick={() => shiftPeriod(1)} title="Mes siguiente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <button className="btn btn-secondary"><I.download /> Exportar PDF</button>
        <button className="btn btn-primary" onClick={onCreateMovimiento}><I.plus /> Nuevo movimiento</button>
      </PageHead>

      {/* KPIs */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <Card>
          <div className="eyebrow">Ingresos</div>
          <div className="kpi" style={{ marginTop: 6 }}>
            <div className="value" style={{ color: "#2E6F70" }}>{money(ingresos)}</div>
            <div className="delta up"><I.arrowUp /> +12% vs abril</div>
          </div>
        </Card>
        <Card>
          <div className="eyebrow">Egresos</div>
          <div className="kpi" style={{ marginTop: 6 }}>
            <div className="value" style={{ color: "var(--coral-500)" }}>{money(egresos)}</div>
            <div className="delta down"><I.arrowUp /> +4% vs abril</div>
          </div>
        </Card>
        <Card highlight>
          <div className="eyebrow">Utilidad</div>
          <div className="kpi" style={{ marginTop: 6 }}>
            <div className="value" style={{ color: "var(--violet-700)" }}>{money(utilidad)}</div>
            <div className="delta" style={{ color: "var(--violet-700)", opacity: 0.85 }}>
              <I.arrowUp /> Margen {margen}%
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="fin-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "movimientos"}
          className={"fin-tab" + (tab === "movimientos" ? " active" : "")}
          onClick={() => setTab("movimientos")}
        >Movimientos <span className="count">{movCount}</span></button>
        <button
          role="tab"
          aria-selected={tab === "imprenta"}
          className={"fin-tab" + (tab === "imprenta" ? " active" : "")}
          onClick={() => setTab("imprenta")}
        >Imprenta <span className="count">{ordCount}</span></button>
      </div>

      {tab === "movimientos" ? (
        <>
          {/* Filtros por tipo */}
          <div className="fin-filter-row">
            <span className="lbl">Tipo</span>
            <button
              className={"fin-pill" + (tipoFilter === "todos" ? " active" : "")}
              onClick={() => setTipoFilter("todos")}
            >Todos</button>
            {tipos.map((t) => {
              const tone = tipoBadge[t.id] || {};
              return (
                <button
                  key={t.id}
                  className={"fin-pill" + (tipoFilter === t.id ? " active" : "")}
                  onClick={() => setTipoFilter(t.id)}
                >
                  <span className="dot" style={{ background: tone.color || "#888" }} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Filtros por cuenta */}
          <div className="fin-filter-row last">
            <span className="lbl">Cuenta</span>
            <button
              className={"fin-pill" + (cuentaFilter === "todas" ? " active" : "")}
              onClick={() => setCuentaFilter("todas")}
            >Todas</button>
            {cuentas.map((c) => (
              <button
                key={c.id}
                className={"fin-pill" + (cuentaFilter === c.id ? " active" : "")}
                onClick={() => setCuentaFilter(c.id)}
              >{c.label}</button>
            ))}
          </div>

          <div className="table-wrap">
            <table className="data-table fin-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Fecha</th>
                  <th style={{ width: 130 }}>Tipo</th>
                  <th style={{ width: 130 }}>Cuenta</th>
                  <th style={{ width: 110 }}>Referencia</th>
                  <th>Detalle</th>
                  <th style={{ width: 140 }}>Nro. factura</th>
                  <th className="num" style={{ width: 130 }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {movsFiltered.map((m) => {
                  const t = tipos.find((x) => x.id === m.tipo) || { label: m.tipo };
                  const tone = tipoBadge[m.tipo] || { bg: "var(--page-bg)", color: "var(--ink-muted)" };
                  const cta = cuentas.find((c) => c.id === m.cuenta) || { label: m.cuenta };
                  return (
                    <tr
                      key={m.id}
                      onDoubleClick={() => onOpenMovimiento && onOpenMovimiento(m)}
                      title="Doble click para editar"
                    >
                      <td style={{ color: "var(--ink-muted)", fontVariantNumeric: "tabular-nums" }}>
                        {fmt(m.fecha)}
                      </td>
                      <td>
                        <span className="fin-tipo-badge" style={{ background: tone.bg, color: tone.color }}>
                          <span className="dot" /> {t.label}
                        </span>
                      </td>
                      <td className="fin-cuenta-cell">{cta.label}</td>
                      <td className="fin-ref-cell">{m.ref}</td>
                      <td>{m.detalle}</td>
                      <td style={{ color: "var(--ink-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        {m.nroFactura || <span style={{ opacity: 0.5 }}>—</span>}
                      </td>
                      <td className={"num " + (m.monto > 0 ? "fin-monto-pos" : "fin-monto-neg")}>
                        {signed(m.monto)}
                      </td>
                    </tr>
                  );
                })}
                {movsFiltered.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--ink-muted)", padding: "24px 0" }}>
                    Sin movimientos con los filtros actuales.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
              Órdenes de impresión del período. La <strong style={{ color: "var(--ink)" }}>diferencia</strong> compara nuestro valor cobrado con el que paga Patri.
            </div>
            <button className="btn btn-primary" onClick={onCreateImprenta}><I.plus /> Nueva orden</button>
          </div>

          <div className="table-wrap">
            <table className="data-table fin-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Fecha</th>
                  <th style={{ width: 110 }}>Presupuesto</th>
                  <th>Temática</th>
                  <th className="num" style={{ width: 70 }}>Hojas</th>
                  <th style={{ width: 160 }}>Tipo hoja</th>
                  <th className="num" style={{ width: 110 }}>Valor nuestro</th>
                  <th className="num" style={{ width: 110 }}>Valor Patri</th>
                  <th className="num" style={{ width: 110 }}>Diferencia</th>
                  <th style={{ width: 130 }}>Método pago</th>
                  <th style={{ width: 110 }}>Pagado</th>
                </tr>
              </thead>
              <tbody>
                {ords.map((o) => {
                  const diff = (o.valorNuestro || 0) - (o.valorPatri || 0);
                  const metodo = metodos.find((m) => m.id === o.metodoPago) || { label: o.metodoPago };
                  return (
                    <tr
                      key={o.id}
                      onDoubleClick={() => onOpenImprenta && onOpenImprenta(o)}
                      title="Doble click para editar"
                    >
                      <td style={{ color: "var(--ink-muted)", fontVariantNumeric: "tabular-nums" }}>
                        {fmt(o.fecha)}
                      </td>
                      <td className="fin-ref-cell">
                        {o.presupuestoId || <span style={{ color: "var(--ink-muted)", opacity: 0.6 }}>—</span>}
                      </td>
                      <td style={{ fontWeight: 500 }}>{o.tematica}</td>
                      <td className="num" style={{ fontVariantNumeric: "tabular-nums" }}>{o.hojas}</td>
                      <td style={{ color: "var(--ink-muted)" }}>{o.tipoHoja}</td>
                      <td className="num" style={{ fontVariantNumeric: "tabular-nums" }}>{money(o.valorNuestro)}</td>
                      <td className="num" style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-muted)" }}>{money(o.valorPatri)}</td>
                      <td className={"num " + (diff >= 0 ? "fin-diff-pos" : "fin-diff-neg")}>
                        {diff >= 0 ? "+ " : "− "}{money(Math.abs(diff))}
                      </td>
                      <td style={{ color: "var(--ink-muted)", textTransform: "capitalize" }}>{metodo.label}</td>
                      <td>
                        <span className={"fin-pagado-badge " + (o.pagado ? "si" : "no")}>
                          <span className="dot" /> {o.pagado ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

/* ====================== CLIENTES ====================== */
function ClientesScreen({ onCreate, onOpenDetail }) {
  const items = (typeof CLIENTES_RICH !== "undefined" && CLIENTES_RICH.length)
    ? CLIENTES_RICH
    : CLIENTS.map((name, i) => ({
        name,
        code: `C-${1001 + i}`,
        ordersCount: [2, 5, 1, 3, 4, 7, 2, 1][i % 8],
        totalFacturado: ([2, 5, 1, 3, 4, 7, 2, 1][i % 8]) * (1800 + i * 320),
        lastOrder: ["hoy", "ayer", "hace 3 días", "hace 1 semana"][i % 4],
        principalCanal: "mail",
        principalCanalVal: name.toLowerCase().replace(/\s+/g, ".") + "@correo.com",
      }));
  const canales = (typeof CANAL_OPTIONS !== "undefined" && CANAL_OPTIONS)
    || [
      { id: "instagram", label: "Instagram", color: "#D7548C" },
      { id: "whatsapp",  label: "WhatsApp",  color: "#1F8A5B" },
      { id: "mail",      label: "Mail",      color: "#2E6F70" },
      { id: "otros",     label: "Otros",     color: "#6B6270" },
    ];
  const palFor = (typeof avatarPaletteFor === "function")
    ? avatarPaletteFor
    : () => ({ bg: "var(--lavender)", ink: "var(--violet-700)" });
  const initsFor = (typeof initialsFor === "function")
    ? initialsFor
    : (n) => (n || "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <PageHead title="Clientes" sub={`${items.length} clientes · ${items.filter((c) => c.activo !== false).length} activos`}>
        <button className="btn btn-primary" onClick={onCreate}><I.plus /> Nuevo cliente</button>
      </PageHead>

      <div className="table-wrap">
        <table className="data-table clientes-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th style={{ width: 100 }}>Código</th>
              <th style={{ width: 140 }}>Último pedido</th>
              <th className="num" style={{ width: 100 }}>Pedidos</th>
              <th className="num" style={{ width: 160 }}>Total facturado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const pal = palFor(c.name);
              const initials = initsFor(c.name);
              const canalMeta = canales.find((o) => o.id === c.principalCanal) || canales[2];
              return (
                <tr
                  key={c.code || c.name}
                  onDoubleClick={() => onOpenDetail && onOpenDetail(c)}
                  title="Doble click para ver detalle"
                >
                  <td>
                    <div className="clientes-name-cell">
                      <div
                        className="clientes-avatar"
                        style={{ background: pal.bg, color: pal.ink }}
                        aria-hidden="true"
                      >{initials}</div>
                      <div className="clientes-name-block">
                        <span className="name">{c.name}</span>
                        <span className="contact">
                          <span className="canal-dot" style={{ background: canalMeta.color }} />
                          <span className="canal-lbl">{canalMeta.label}</span>
                          <span className="canal-val">{c.principalCanalVal || "—"}</span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="clientes-code">{c.code}</span>
                  </td>
                  <td style={{ color: "var(--ink-muted)" }}>{c.lastOrder || "—"}</td>
                  <td className="num" style={{ fontVariantNumeric: "tabular-nums" }}>{c.ordersCount || 0}</td>
                  <td className="num" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{money(c.totalFacturado || 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

Object.assign(window, { PresupuestosScreen, CatalogoScreen, InsumosScreen, FinanzasScreen, ClientesScreen });
