/* global React, ReactDOM, Sidebar, Topbar, LoginScreen, PresupuestoEditor, Toast,
          DashboardScreen, PresupuestosScreen, CatalogoScreen, InsumosScreen,
          FinanzasScreen, ClientesScreen, ProductosScreen, HeartbeatOverlay,
          ProductoDetalleScreen, InsumoDetalleScreen,
          MovimientoDrawer, ImprentaDrawer, FinanzasHeartbeat,
          MOVIMIENTOS, IMPRENTA_ORDENES,
          ClienteDetalleScreen, AjustesScreen */
const { useState, useEffect } = React;

const CRUMBS = {
  dashboard:    ["Presumemi", "Inicio"],
  presupuestos: ["Presumemi", "Presupuestos"],
  productos:    ["Presumemi", "Productos"],
  insumos:      ["Presumemi", "Insumos"],
  finanzas:     ["Presumemi", "Finanzas"],
  clientes:     ["Presumemi", "Clientes"],
  ajustes:      ["Presumemi", "Ajustes"],
};

function App() {
  const [authed, setAuthed]   = useState(true);
  const [route, setRoute]     = useState("dashboard");
  const [drawer, setDrawer]   = useState(null);   // null | folio | "new"
  const [toast, setToast]     = useState("");
  const [productoDetail, setProductoDetail] = useState(null); // producto seleccionado | null
  const [insumoDetail,   setInsumoDetail]   = useState(null); // insumo seleccionado   | null
  const [clienteDetail,  setClienteDetail]  = useState(null); // cliente seleccionado  | null

  // Finanzas
  const [movimientoDrawer, setMovimientoDrawer] = useState(null); // null | movimiento | "new"
  const [imprentaDrawer,   setImprentaDrawer]   = useState(null); // null | orden       | "new"
  const [movimientos, setMovimientos] = useState(() =>
    (typeof MOVIMIENTOS !== "undefined" ? MOVIMIENTOS : []));
  const [imprentaOrdenes, setImprentaOrdenes] = useState(() =>
    (typeof IMPRENTA_ORDENES !== "undefined" ? IMPRENTA_ORDENES : []));
  const [finBeatKey, setFinBeatKey] = useState(0);

  // Productos -> "Nuevo producto" heartbeat + sidebar nav pulse
  const [heartbeatKey, setHeartbeatKey] = useState(0);
  const [pulseRoute, setPulseRoute]     = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const openPresupuesto = (folio) => setDrawer(folio || "new");
  const closeDrawer = () => setDrawer(null);
  const onSaved = (msg) => { setToast(msg); closeDrawer(); };

  const onCreateProducto = () => {
    setHeartbeatKey(k => k + 1);
    setPulseRoute(null);
    requestAnimationFrame(() => setPulseRoute("productos"));
    setTimeout(() => setPulseRoute(null), 1700);
    setTimeout(() => setToast("Abriendo nuevo producto\u2026"), 950);
  };
  const onOpenProducto = (p) => {
    setProductoDetail(p);
  };
  const closeProductoDetail = () => setProductoDetail(null);
  const onProductoSaved = (p) => {
    setToast(`Guardado \u00b7 ${p.code} \u00b7 ${p.nombre || p.name}`);
    setProductoDetail(null);
  };
  const onProductoDeleted = (p) => {
    setToast(`Producto ${p.code} eliminado.`);
    setProductoDetail(null);
  };

  // Insumos
  const onCreateInsumo = () => {
    setHeartbeatKey(k => k + 1);
    setPulseRoute(null);
    requestAnimationFrame(() => setPulseRoute("insumos"));
    setTimeout(() => setPulseRoute(null), 1700);
    setTimeout(() => setToast("Abriendo nuevo insumo\u2026"), 950);
  };
  const onOpenInsumo = (i) => setInsumoDetail(i);
  const closeInsumoDetail = () => setInsumoDetail(null);
  const onInsumoSaved = (i) => {
    setToast(`Guardado \u00b7 ${i.code} \u00b7 ${i.name}`);
    setInsumoDetail(null);
  };
  const onInsumoDeleted = (i) => {
    setToast(`Insumo ${i.code} eliminado.`);
    setInsumoDetail(null);
  };

  // Clientes
  const onCreateCliente = () => {
    setHeartbeatKey(k => k + 1);
    setPulseRoute(null);
    requestAnimationFrame(() => setPulseRoute("clientes"));
    setTimeout(() => setPulseRoute(null), 1700);
    setTimeout(() => setToast("Abriendo nuevo cliente\u2026"), 950);
  };
  const onOpenCliente = (c) => setClienteDetail(c);
  const closeClienteDetail = () => setClienteDetail(null);
  const onClienteSaved = (c) => {
    setToast(`Guardado \u00b7 ${c.code} \u00b7 ${c.name}`);
    setClienteDetail(null);
  };
  const onClienteDeleted = (c) => {
    setToast(`Cliente ${c.code} eliminado.`);
    setClienteDetail(null);
  };

  // ----- Finanzas: movimiento drawer -----
  const triggerFinBeat = () => {
    setFinBeatKey(0);
    requestAnimationFrame(() => setFinBeatKey(k => k + 1));
    setTimeout(() => setFinBeatKey(0), 1300);
  };
  const onCreateMovimiento = () => { triggerFinBeat(); setMovimientoDrawer("new"); };
  const onOpenMovimiento   = (m) => { triggerFinBeat(); setMovimientoDrawer(m); };
  const closeMovimientoDrawer = () => setMovimientoDrawer(null);
  const onMovimientoSaved = (m, isNew) => {
    setMovimientos((ls) => {
      const i = ls.findIndex((x) => x.id === m.id);
      if (i < 0) return [m, ...ls];
      const next = ls.slice(); next[i] = m; return next;
    });
    setToast(isNew ? "Movimiento creado." : `Movimiento actualizado.`);
    setMovimientoDrawer(null);
  };

  // ----- Finanzas: imprenta drawer -----
  const onCreateImprenta = () => { triggerFinBeat(); setImprentaDrawer("new"); };
  const onOpenImprenta   = (o) => { triggerFinBeat(); setImprentaDrawer(o); };
  const closeImprentaDrawer = () => setImprentaDrawer(null);
  const onImprentaSaved = (o, isNew) => {
    setImprentaOrdenes((ls) => {
      const i = ls.findIndex((x) => x.id === o.id);
      if (i < 0) return [o, ...ls];
      const next = ls.slice(); next[i] = o; return next;
    });
    setToast(isNew ? "Orden de imprenta creada." : "Orden actualizada.");
    setImprentaDrawer(null);
  };

  let screen = null;
  switch (route) {
    case "dashboard":    screen = <DashboardScreen onOpenPresupuesto={openPresupuesto} onNavigate={setRoute} />; break;
    case "presupuestos": screen = <PresupuestosScreen onOpen={openPresupuesto} />; break;
    case "productos":    screen = <ProductosScreen onCreate={onCreateProducto} onOpenDetail={onOpenProducto} />; break;
    case "insumos":      screen = <InsumosScreen onCreate={onCreateInsumo} onOpenDetail={onOpenInsumo} />; break;
    case "finanzas":     screen = <FinanzasScreen
      movimientos={movimientos}
      imprentaOrdenes={imprentaOrdenes}
      onCreateMovimiento={onCreateMovimiento}
      onOpenMovimiento={onOpenMovimiento}
      onCreateImprenta={onCreateImprenta}
      onOpenImprenta={onOpenImprenta}
    />; break;
    case "clientes":     screen = <ClientesScreen onCreate={onCreateCliente} onOpenDetail={onOpenCliente} />; break;
    case "ajustes":      screen = <AjustesScreen />; break;
    default:             screen = <PlaceholderScreen route={route} />;
  }

  return (
    <div className="app">
      <Sidebar route={route} onNavigate={setRoute} onLogout={() => setAuthed(false)} pulseRoute={pulseRoute} />
      <div className="main">
        <Topbar crumbs={CRUMBS[route] || ["Presumemi"]} />
        <div className="content" data-screen-label={route}>
          {screen}
        </div>
        {(route === "productos" || route === "insumos" || route === "clientes") && heartbeatKey > 0 && <HeartbeatOverlay k={heartbeatKey} />}
        {drawer && (
          <PresupuestoEditor
            folio={drawer === "new" ? null : drawer}
            onClose={closeDrawer}
            onSaved={onSaved}
          />
        )}
        {productoDetail && (
          <ProductoDetalleScreen
            product={productoDetail}
            onBack={closeProductoDetail}
            onSaved={onProductoSaved}
            onDeleted={onProductoDeleted}
          />
        )}
        {insumoDetail && (
          <InsumoDetalleScreen
            insumo={insumoDetail}
            onBack={closeInsumoDetail}
            onSaved={onInsumoSaved}
            onDeleted={onInsumoDeleted}
          />
        )}
        {clienteDetail && (
          <ClienteDetalleScreen
            cliente={clienteDetail}
            onBack={closeClienteDetail}
            onSaved={onClienteSaved}
            onDeleted={onClienteDeleted}
            onOpenPresupuesto={(folio) => { closeClienteDetail(); setDrawer(folio); }}
          />
        )}
        {movimientoDrawer && (
          <MovimientoDrawer
            movimiento={movimientoDrawer === "new" ? null : movimientoDrawer}
            onClose={closeMovimientoDrawer}
            onSaved={onMovimientoSaved}
          />
        )}
        {imprentaDrawer && (
          <ImprentaDrawer
            orden={imprentaDrawer === "new" ? null : imprentaDrawer}
            onClose={closeImprentaDrawer}
            onSaved={onImprentaSaved}
          />
        )}
        {route === "finanzas" && finBeatKey > 0 && <FinanzasHeartbeat k={finBeatKey} />}
      </div>
      <Toast message={toast} />
    </div>
  );
}

function PlaceholderScreen({ route }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: 48, textAlign: "center", color: "var(--ink-muted)"
    }}>
      <h3 style={{ marginBottom: 8 }}>{route.charAt(0).toUpperCase() + route.slice(1)}</h3>
      <p>Pantalla por diseñar — el kit demuestra el patrón de navegación.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
