/* global React, I */
// Sidebar, Topbar, Brand, common UI primitives

const NAV = [
  { id: "dashboard",    label: "Inicio",          icon: "dashboard" },
  { id: "presupuestos", label: "Presupuestos",    icon: "doc" },
  { id: "productos",    label: "Productos",       icon: "box" },
  { id: "insumos",      label: "Insumos",         icon: "stack" },
  { id: "finanzas",     label: "Finanzas",        icon: "coin" },
  { id: "clientes",     label: "Clientes",        icon: "users" },
];

function Sidebar({ route, onNavigate, onLogout, pulseRoute }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="../../assets/memydeni-logo.png" alt="MemyDeni" />
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Operación</div>
        {NAV.slice(0, 5).map(n => {
          const Icon = I[n.icon];
          const isActive = route === n.id;
          return (
            <button
              key={n.id}
              className={
                "nav-item" +
                (isActive ? " active" : "") +
                (pulseRoute === n.id ? " pulse" : "")
              }
              onClick={() => onNavigate(n.id)}
            >
              <Icon /> {n.label}
            </button>
          );
        })}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Datos</div>
        {NAV.slice(5).map(n => {
          const Icon = I[n.icon];
          return (
            <button
              key={n.id}
              className={"nav-item" + (route === n.id ? " active" : "")}
              onClick={() => onNavigate(n.id)}
            >
              <Icon /> {n.label}
            </button>
          );
        })}
      </div>

      <div className="sidebar-foot">
        <button
          className={"nav-item sidebar-ajustes" + (route === "ajustes" ? " active" : "")}
          onClick={() => onNavigate("ajustes")}
        >
          <I.cog /> Ajustes
        </button>
        <div className="sidebar-foot-user">
          <div className="avatar">DM</div>
          <div className="who">
            <div className="name">Deni M.</div>
            <div className="role">Propietaria</div>
          </div>
          <div className="spacer"></div>
          <button
            className="nav-item"
            style={{ padding: 6, width: 28, height: 28, justifyContent: "center" }}
            title="Cerrar sesión"
            onClick={onLogout}
          ><I.logout /></button>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ crumbs, onSearch }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ opacity: 0.5 }}>/</span>}
            {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="search">
        <I.search />
        <input placeholder="Buscar presupuestos, clientes, productos…" onChange={onSearch} />
      </div>
      <button className="icon-btn" title="Notificaciones"><I.bell /></button>
    </div>
  );
}

function PageHead({ title, sub, children }) {
  return (
    <div className="page-head">
      <div className="title">
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}

function Card({ children, highlight, style }) {
  return (
    <div className={"card" + (highlight ? " highlight" : "")} style={style}>
      {children}
    </div>
  );
}

function Badge({ tone = "default", dot, children }) {
  return (
    <span className={"badge " + tone}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

function Toast({ message, tone }) {
  if (!message) return null;
  return (
    <div className="toast">
      <span style={{
        width: 16, height: 16, borderRadius: "50%",
        display: "grid", placeItems: "center",
        background: tone === "danger" ? "var(--coral-500)" : "var(--teal-500)",
        color: "#fff", fontSize: 10, fontWeight: 700
      }}>✓</span>
      {message}
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, PageHead, Card, Badge, Toast, NAV });
