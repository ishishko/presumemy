/* global React, I, avatarPaletteFor, initialsFor, CANAL_OPTIONS */
// Pantalla "Ajustes" — bloques apilados verticalmente, cada uno con su
// propio botón "Guardar cambios". No hay guardado global.
// Expone AjustesScreen al window.

const { useState: useAState, useMemo: useAMemo, useRef: useARef } = React;

/* =========================================================
   Catálogos
   ========================================================= */
const MONEDAS = [
  { id: "ARS",   label: "ARS — Peso argentino" },
  { id: "USD",   label: "USD — Dólar estadounidense" },
  { id: "EUR",   label: "EUR — Euro" },
  { id: "OTRA",  label: "Otra moneda…" },
];

const ROLES = [
  { id: "propietaria", label: "Propietaria" },
  { id: "admin",       label: "Administrador" },
  { id: "diseno",      label: "Diseño" },
  { id: "produccion",  label: "Producción" },
  { id: "lector",      label: "Solo lectura" },
];

const WIDGETS_PROXIMOS = [
  { id: "kpis_mes",       label: "KPIs del mes",                 hint: "Ingresos, egresos y utilidad del período activo." },
  { id: "agenda",         label: "Agenda de entregas",            hint: "Cumples y eventos de los próximos 14 días." },
  { id: "alertas_stock",  label: "Alertas de stock",              hint: "Insumos por debajo del mínimo configurado." },
  { id: "top_clientes",   label: "Top clientes del mes",          hint: "Ranking por facturación del período activo." },
];

const SOCIOS_INICIAL = [
  { id: 1, name: "Meme",   pct: 40, activo: true  },
  { id: 2, name: "Pety",   pct: 30, activo: true  },
  { id: 3, name: "Gastos", pct: 30, activo: true  },
];

const USUARIOS_INICIAL = [
  { id: 1, name: "Deni M.",     email: "deni@memydeni.com",     activo: true,  rol: "propietaria" },
  { id: 2, name: "Pati Ramos",  email: "pati@memydeni.com",     activo: true,  rol: "admin"       },
  { id: 3, name: "Lautaro F.",  email: "lautaro@memydeni.com",  activo: true,  rol: "diseno"      },
  { id: 4, name: "Sofía López", email: "sofi@memydeni.com",     activo: false, rol: "produccion"  },
];

const palFor = (n) =>
  (typeof avatarPaletteFor === "function" ? avatarPaletteFor(n) : { bg: "var(--lavender)", ink: "var(--violet-700)" });
const initsOf = (n) =>
  (typeof initialsFor === "function"
    ? initialsFor(n)
    : (n || "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase());

const CANALES_AJUSTES =
  (typeof CANAL_OPTIONS !== "undefined" && CANAL_OPTIONS)
    || [
      { id: "instagram", label: "Instagram", color: "#D7548C" },
      { id: "whatsapp",  label: "WhatsApp",  color: "#1F8A5B" },
      { id: "mail",      label: "Mail",      color: "#2E6F70" },
      { id: "otros",     label: "Otros",     color: "#6B6270" },
    ];

const newAid = (() => { let i = 100; return () => ++i; })();

/* =========================================================
   Bloque genérico
   ========================================================= */
function AjustesBlock({ title, description, dirty, onSave, children, footExtra }) {
  return (
    <section className="aj-block">
      <header className="aj-block-head">
        <div>
          <h3>{title}</h3>
          {description && <p className="hint">{description}</p>}
        </div>
        {dirty && (
          <span className="aj-dirty-chip" title="Cambios sin guardar">
            <span className="dot" /> Sin guardar
          </span>
        )}
      </header>

      <div className="aj-block-body">{children}</div>

      <footer className="aj-block-foot">
        {footExtra}
        <div className="spacer" />
        <button
          className="btn btn-primary"
          onClick={onSave}
          disabled={!dirty}
          style={{ opacity: dirty ? 1 : 0.5, pointerEvents: dirty ? "auto" : "none" }}
        >
          <I.check /> Guardar cambios
        </button>
      </footer>
    </section>
  );
}

/* =========================================================
   Bloque "Próximamente · V2"
   ========================================================= */
function ProximoSubsection({ title, hint, children }) {
  return (
    <div className="aj-proximo">
      <div className="aj-proximo-head">
        <div className="aj-proximo-titles">
          <h4>{title}</h4>
          {hint && <p className="hint">{hint}</p>}
        </div>
        <span className="aj-soon-badge">Próximamente · V2</span>
      </div>
      <fieldset disabled className="aj-proximo-body">
        {children}
      </fieldset>
    </div>
  );
}

/* =========================================================
   Switch reutilizable
   ========================================================= */
function AjSwitch({ on, onToggle, disabled }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      tabIndex={disabled ? -1 : 0}
      className={"aj-switch" + (on ? " on" : "") + (disabled ? " disabled" : "")}
      onClick={() => !disabled && onToggle()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(); }
      }}
    />
  );
}

/* =========================================================
   Bloque 1 — Inicio
   ========================================================= */
function BloqueInicio() {
  const initial = useARef({
    nombre: "MemyDeni",
    logo: null,
    domicilio: {
      calle: "Av. Cabildo", numero: "2345", piso: "",
      ciudad: "Buenos Aires", provincia: "CABA",
      cp: "C1428", pais: "Argentina", referencia: "",
    },
    contactoCanal: "instagram",
    contactoValor: "@memydeni",
    moneda: "ARS",
  });

  const [nombre, setNombre]   = useAState(initial.current.nombre);
  const [logo, setLogo]       = useAState(initial.current.logo);

  const [calle, setCalle]         = useAState(initial.current.domicilio.calle);
  const [numero, setNumero]       = useAState(initial.current.domicilio.numero);
  const [piso, setPiso]           = useAState(initial.current.domicilio.piso);
  const [ciudad, setCiudad]       = useAState(initial.current.domicilio.ciudad);
  const [provincia, setProvincia] = useAState(initial.current.domicilio.provincia);
  const [cp, setCp]               = useAState(initial.current.domicilio.cp);
  const [pais, setPais]           = useAState(initial.current.domicilio.pais);
  const [referencia, setReferencia] = useAState(initial.current.domicilio.referencia);

  const [contactoCanal, setContactoCanal] = useAState(initial.current.contactoCanal);
  const [contactoValor, setContactoValor] = useAState(initial.current.contactoValor);
  const [moneda, setMoneda]               = useAState(initial.current.moneda);

  const [dragOver, setDragOver] = useAState(false);

  const dirty = useAMemo(() => {
    const i = initial.current;
    return (
      nombre !== i.nombre ||
      logo !== i.logo ||
      calle !== i.domicilio.calle ||
      numero !== i.domicilio.numero ||
      piso !== i.domicilio.piso ||
      ciudad !== i.domicilio.ciudad ||
      provincia !== i.domicilio.provincia ||
      cp !== i.domicilio.cp ||
      pais !== i.domicilio.pais ||
      referencia !== i.domicilio.referencia ||
      contactoCanal !== i.contactoCanal ||
      contactoValor !== i.contactoValor ||
      moneda !== i.moneda
    );
  }, [nombre, logo, calle, numero, piso, ciudad, provincia, cp, pais, referencia,
      contactoCanal, contactoValor, moneda]);

  const onSave = () => {
    initial.current = {
      nombre, logo,
      domicilio: { calle, numero, piso, ciudad, provincia, cp, pais, referencia },
      contactoCanal, contactoValor, moneda,
    };
  };

  const onDropLogo = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type.startsWith("image/")) setLogo(URL.createObjectURL(f));
  };
  const onPickLogo = (e) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) setLogo(URL.createObjectURL(f));
    e.target.value = "";
  };

  const canalMeta = CANALES_AJUSTES.find((c) => c.id === contactoCanal) || CANALES_AJUSTES[0];

  return (
    <AjustesBlock
      title="Inicio"
      description="Datos del negocio que aparecen en presupuestos, comprobantes y la app."
      dirty={dirty}
      onSave={onSave}
    >
      <div className="aj-grid-2">
        <div className="aj-field">
          <label>Nombre del negocio</label>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="MemyDeni" />
        </div>
        <div className="aj-field">
          <label>Moneda</label>
          <select className="select" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
            {MONEDAS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div className="aj-field aj-field-logo">
        <label>Logo</label>
        <div className="aj-logo-row">
          <div className="aj-logo-preview">
            {logo
              ? <img src={logo} alt="Logo" />
              : <span className="hint">Sin logo</span>}
          </div>
          <label
            className={"aj-drop" + (dragOver ? " over" : "")}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDropLogo}
          >
            <I.download />
            <span>
              Arrastrá tu logo acá o <strong>subí desde tu equipo</strong>
              <small> PNG o JPG · 512 × 512 px recomendado</small>
            </span>
            <input type="file" accept="image/*" hidden onChange={onPickLogo} />
          </label>
        </div>
      </div>

      <h5 className="aj-subhead">Domicilio</h5>
      <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
        Se usa en el pie del PDF de presupuestos y en datos de facturación.
      </p>
      <div className="aj-dom-grid">
        <div className="aj-field" style={{ gridColumn: "1 / span 2" }}>
          <label>Calle</label>
          <input className="input" value={calle} onChange={(e) => setCalle(e.target.value)} />
        </div>
        <div className="aj-field">
          <label>Número</label>
          <input className="input" value={numero} onChange={(e) => setNumero(e.target.value)} style={{ fontVariantNumeric: "tabular-nums" }} />
        </div>
        <div className="aj-field" style={{ gridColumn: "1 / span 2" }}>
          <label>Piso / Depto <span className="optional">(opcional)</span></label>
          <input className="input" value={piso} onChange={(e) => setPiso(e.target.value)} />
        </div>
        <div className="aj-field">
          <label>Código postal</label>
          <input className="input" value={cp} onChange={(e) => setCp(e.target.value)} style={{ fontVariantNumeric: "tabular-nums" }} />
        </div>
        <div className="aj-field">
          <label>Ciudad</label>
          <input className="input" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </div>
        <div className="aj-field">
          <label>Provincia</label>
          <input className="input" value={provincia} onChange={(e) => setProvincia(e.target.value)} />
        </div>
        <div className="aj-field">
          <label>País</label>
          <input className="input" value={pais} onChange={(e) => setPais(e.target.value)} />
        </div>
        <div className="aj-field" style={{ gridColumn: "1 / -1" }}>
          <label>Referencia <span className="optional">(opcional)</span></label>
          <input className="input" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Entrada por el frente · timbre 3" />
        </div>
      </div>

      <h5 className="aj-subhead">Contacto del negocio</h5>
      <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
        Aparece como dato de contacto principal en el PDF de presupuestos.
      </p>
      <div className="aj-grid-2">
        <div className="aj-field">
          <label>Canal</label>
          <div className="aj-canal-select">
            <span className="canal-dot" style={{ background: canalMeta.color }} />
            <select className="select" value={contactoCanal} onChange={(e) => setContactoCanal(e.target.value)}>
              {CANALES_AJUSTES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="aj-field">
          <label>Valor</label>
          <input
            className="input"
            value={contactoValor}
            onChange={(e) => setContactoValor(e.target.value)}
            placeholder={
              contactoCanal === "instagram" ? "@memydeni"
              : contactoCanal === "whatsapp" ? "+54 9 11 5555-1234"
              : contactoCanal === "mail" ? "hola@memydeni.com"
              : "Detalle del contacto"
            }
          />
        </div>
      </div>

      <ProximoSubsection
        title="Widgets del dashboard"
        hint="Vas a poder elegir qué tarjetas aparecen en Inicio y en qué orden."
      >
        {WIDGETS_PROXIMOS.map((w) => (
          <div key={w.id} className="aj-toggle-row">
            <div className="lbl">
              <span className="t">{w.label}</span>
              <span className="h">{w.hint}</span>
            </div>
            <AjSwitch on={false} onToggle={() => {}} disabled />
          </div>
        ))}
      </ProximoSubsection>
    </AjustesBlock>
  );
}

/* =========================================================
   Bloque 2 — Presupuestos
   ========================================================= */
function BloquePresupuestos() {
  const initial = useARef({ auto: true, dias: 7 });
  const [auto, setAuto] = useAState(initial.current.auto);
  const [dias, setDias] = useAState(initial.current.dias);

  const dirty = useAMemo(
    () => auto !== initial.current.auto || Number(dias) !== Number(initial.current.dias),
    [auto, dias]
  );

  const onSave = () => { initial.current = { auto, dias }; };

  return (
    <AjustesBlock
      title="Presupuestos"
      description="Comportamiento por defecto del flujo de presupuestos."
      dirty={dirty}
      onSave={onSave}
    >
      <div className="aj-toggle-row aj-toggle-row-card">
        <div className="lbl">
          <span className="t">Cancelación automática por tiempo</span>
          <span className="h">
            Los presupuestos en estado <strong style={{ color: "var(--ink)" }}>Enviado</strong>
            {" "}se cancelarán automáticamente luego de X días sin confirmación.
          </span>
        </div>
        <AjSwitch on={auto} onToggle={() => setAuto((v) => !v)} />
      </div>

      {auto && (
        <div className="aj-conditional" role="group">
          <div className="aj-field" style={{ maxWidth: 220 }}>
            <label>Días de espera</label>
            <div className="aj-num-with-unit">
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
              />
              <span className="aj-unit-pill">días</span>
            </div>
          </div>
          <p className="hint">
            Después de <strong>{dias || 0} día{Number(dias) === 1 ? "" : "s"}</strong>
            {" "}sin respuesta, el presupuesto pasa a <em>Cancelado</em>.
          </p>
        </div>
      )}
    </AjustesBlock>
  );
}

/* =========================================================
   Bloque 3 — Finanzas
   ========================================================= */
function BloqueFinanzas() {
  const initial = useARef({
    socios: SOCIOS_INICIAL.map((s) => ({ ...s })),
  });
  const [socios, setSocios] = useAState(initial.current.socios.map((s) => ({ ...s })));

  const totalActivo = useAMemo(
    () => socios.filter((s) => s.activo).reduce((sum, s) => sum + (parseFloat(s.pct) || 0), 0),
    [socios]
  );
  const valid = Math.abs(totalActivo - 100) < 0.01;

  const dirty = useAMemo(
    () => JSON.stringify(socios) !== JSON.stringify(initial.current.socios),
    [socios]
  );

  const update = (id, patch) =>
    setSocios((ls) => ls.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const onSave = () => {
    if (!valid) return;
    initial.current = { socios: socios.map((s) => ({ ...s })) };
  };

  return (
    <AjustesBlock
      title="Finanzas"
      description="Distribución automática de ganancias al cerrar el período."
      dirty={dirty}
      onSave={onSave}
      footExtra={
        <span className={"aj-sum-indicator " + (valid ? "ok" : "err")}>
          <span className="dot" />
          Suma activa: <strong>{totalActivo}%</strong>
          {!valid && <span className="aj-sum-err-hint"> · debe ser 100%</span>}
        </span>
      }
    >
      <div className="aj-socios-table">
        <table>
          <colgroup>
            <col />
            <col style={{ width: 160 }} />
            <col style={{ width: 90 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Socio / Destino</th>
              <th className="num">Porcentaje</th>
              <th className="center">Activo</th>
            </tr>
          </thead>
          <tbody>
            {socios.map((s) => (
              <tr key={s.id} className={s.activo ? "" : "off"}>
                <td>
                  <input
                    className="prov-input"
                    value={s.name}
                    onChange={(e) => update(s.id, { name: e.target.value })}
                  />
                </td>
                <td>
                  <div className="aj-pct-cell">
                    <input
                      className="prov-input num"
                      type="number"
                      min="0" max="100" step="1"
                      value={s.pct}
                      onChange={(e) => update(s.id, { pct: e.target.value })}
                    />
                    <span className="aj-pct-unit">%</span>
                  </div>
                </td>
                <td className="center">
                  <AjSwitch on={s.activo} onToggle={() => update(s.id, { activo: !s.activo })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AjustesBlock>
  );
}

/* =========================================================
   Bloque 4 — Usuarios
   ========================================================= */
function BloqueUsuarios() {
  const initial = useARef({ usuarios: USUARIOS_INICIAL.map((u) => ({ ...u })) });
  const [usuarios, setUsuarios] = useAState(initial.current.usuarios.map((u) => ({ ...u })));

  const dirty = useAMemo(
    () => JSON.stringify(usuarios) !== JSON.stringify(initial.current.usuarios),
    [usuarios]
  );

  const update = (id, patch) =>
    setUsuarios((ls) => ls.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const onSave = () => { initial.current = { usuarios: usuarios.map((u) => ({ ...u })) }; };

  return (
    <AjustesBlock
      title="Usuarios"
      description="Equipo con acceso a Presumemi. La propietaria siempre tiene permisos completos."
      dirty={dirty}
      onSave={onSave}
    >
      <div className="aj-users-table">
        <table>
          <colgroup>
            <col />
            <col style={{ width: 220 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 170 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th className="center">Estado</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const pal = palFor(u.name);
              return (
                <tr key={u.id} className={u.activo ? "" : "off"}>
                  <td>
                    <div className="aj-user-cell">
                      <div
                        className="aj-user-avatar"
                        style={{ background: pal.bg, color: pal.ink }}
                      >{initsOf(u.name)}</div>
                      <span className="aj-user-name">{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--ink-muted)", fontSize: 13 }}>{u.email}</td>
                  <td className="center">
                    <AjSwitch
                      on={u.activo}
                      onToggle={() => update(u.id, { activo: !u.activo })}
                      disabled={u.rol === "propietaria"}
                    />
                  </td>
                  <td>
                    <select
                      className="select"
                      value={u.rol}
                      onChange={(e) => update(u.id, { rol: e.target.value })}
                      disabled={u.rol === "propietaria"}
                    >
                      {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button className="aj-add-user">
        <I.plus /> Invitar usuario
      </button>
    </AjustesBlock>
  );
}

/* =========================================================
   Bloque 5 — Cuenta
   ========================================================= */
function BloqueCuenta() {
  const initial = useARef({ nombre: "Deni M." });
  const [nombre, setNombre] = useAState(initial.current.nombre);

  const dirty = nombre !== initial.current.nombre;
  const onSave = () => { initial.current = { nombre }; };

  return (
    <AjustesBlock
      title="Cuenta"
      description="Tu información personal y preferencias de la sesión."
      dirty={dirty}
      onSave={onSave}
    >
      <div className="aj-grid-2">
        <div className="aj-field">
          <label>Nombre</label>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="aj-field">
          <label>Email <span className="optional">(solo lectura)</span></label>
          <input className="input readonly" value="deni@memydeni.com" readOnly tabIndex={-1} />
        </div>
      </div>

      <div className="aj-password-row">
        <div>
          <div className="t">Contraseña</div>
          <div className="h">Última actualización: 12 abr 2026</div>
        </div>
        <button className="btn btn-secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
               style={{ width: 14, height: 14 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {" "}Cambiar contraseña
        </button>
      </div>

      <ProximoSubsection
        title="Apariencia"
        hint="Vas a poder elegir entre modo claro y modo oscuro."
      >
        <div className="aj-appearance-grid">
          <label className="aj-theme-card">
            <span className="prev light" />
            <div>
              <span className="t">Modo claro</span>
              <span className="h">Por defecto en V1.</span>
            </div>
            <input type="radio" name="theme" defaultChecked disabled />
          </label>
          <label className="aj-theme-card">
            <span className="prev dark" />
            <div>
              <span className="t">Modo oscuro</span>
              <span className="h">Para sesiones nocturnas.</span>
            </div>
            <input type="radio" name="theme" disabled />
          </label>
        </div>
      </ProximoSubsection>
    </AjustesBlock>
  );
}

/* =========================================================
   AjustesScreen + estilos auto-inyectados
   ========================================================= */
function AjustesScreen() {
  return (
    <>
      <AjustesStyles />
      <div className="page-head">
        <div className="title">
          <h1>Ajustes</h1>
          <div className="sub">Configurá el negocio, tu equipo y tu cuenta.</div>
        </div>
      </div>

      <div className="aj-stack">
        <BloqueInicio />
        <BloquePresupuestos />
        <BloqueFinanzas />
        <BloqueUsuarios />
        <BloqueCuenta />
      </div>
    </>
  );
}

function AjustesStyles() {
  return (
    <style>{`
      .aj-stack {
        display: flex; flex-direction: column;
        gap: 20px;
        max-width: 960px;
      }

      /* Block shell */
      .aj-block {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-1);
        display: flex; flex-direction: column;
        overflow: hidden;
      }
      .aj-block-head {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 16px;
        padding: 20px 24px 16px;
        border-bottom: 1px solid var(--border);
      }
      .aj-block-head h3 {
        font-size: 18px; font-weight: 500; color: var(--ink);
        letter-spacing: -0.005em;
        margin: 0 0 4px;
      }
      .aj-block-head .hint {
        font-size: 13px; color: var(--ink-muted); margin: 0;
        max-width: 540px;
      }
      .aj-dirty-chip {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 11px;
        padding: 4px 10px;
        background: var(--yellow); color: var(--yellow-ink);
        border-radius: 999px;
        flex-shrink: 0;
      }
      .aj-dirty-chip .dot {
        width: 5px; height: 5px; border-radius: 50%;
        background: var(--yellow-ink);
      }

      .aj-block-body {
        padding: 20px 24px;
        display: flex; flex-direction: column; gap: 16px;
      }
      .aj-block-foot {
        display: flex; align-items: center; gap: 12px;
        padding: 14px 24px;
        background: var(--page-bg);
        border-top: 1px solid var(--border);
      }
      .aj-block-foot .spacer { flex: 1; }

      /* Subheadings within a block */
      .aj-subhead {
        font-size: 11px; font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted);
        margin: 12px 0 6px;
        padding-top: 14px;
        border-top: 1px solid var(--border);
      }

      /* Field primitives */
      .aj-field { display: flex; flex-direction: column; gap: 6px; }
      .aj-field > label {
        font-size: 11px; font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted);
      }
      .aj-field > label .optional {
        font-size: 10px; color: var(--ink-muted);
        font-weight: 400; text-transform: lowercase; letter-spacing: 0;
        margin-left: 4px;
      }
      .aj-field .input.readonly,
      .aj-field input.readonly {
        background: var(--page-bg);
        color: var(--ink-muted);
        cursor: default;
      }
      .aj-grid-2 {
        display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
      }
      .aj-dom-grid {
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;
      }

      /* Logo upload */
      .aj-logo-row {
        display: grid; grid-template-columns: 130px 1fr; gap: 12px;
        align-items: stretch;
      }
      .aj-logo-preview {
        background: #F0EEF4;
        border-radius: var(--r-md);
        display: grid; place-items: center;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        color: var(--ink-muted);
        font-size: 12px;
      }
      .aj-logo-preview img {
        width: 100%; height: 100%; object-fit: contain;
      }
      .aj-drop {
        border: 1px dashed var(--border-strong);
        border-radius: var(--r-md);
        padding: 16px;
        text-align: center;
        font-size: 13px;
        color: var(--ink-muted);
        background: var(--page-bg);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-direction: column; gap: 6px;
        transition: border-color 120ms ease, background 120ms ease, color 120ms ease;
      }
      .aj-drop:hover, .aj-drop.over {
        border-color: var(--teal-500); background: var(--teal-50); color: var(--ink);
      }
      .aj-drop strong { color: var(--violet-700); font-weight: 500; }
      .aj-drop small { display: block; font-size: 11px; color: var(--ink-muted); margin-top: 4px; }
      .aj-drop svg { width: 18px; height: 18px; color: var(--violet-700); }

      /* Canal selector with leading dot */
      .aj-canal-select {
        position: relative;
        display: flex; align-items: center;
      }
      .aj-canal-select .canal-dot {
        position: absolute; left: 12px; top: 50%;
        transform: translateY(-50%);
        width: 8px; height: 8px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1;
      }
      .aj-canal-select .select { padding-left: 28px; width: 100%; }

      /* Toggle row */
      .aj-toggle-row {
        display: flex; align-items: center; justify-content: space-between;
        gap: 16px;
      }
      .aj-toggle-row .lbl { display: flex; flex-direction: column; gap: 3px; }
      .aj-toggle-row .lbl .t { font-size: 13px; font-weight: 500; color: var(--ink); }
      .aj-toggle-row .lbl .h { font-size: 12px; color: var(--ink-muted); max-width: 560px; }
      .aj-toggle-row-card {
        padding: 14px 16px;
        background: var(--page-bg);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
      }

      .aj-switch {
        position: relative;
        width: 36px; height: 20px;
        border-radius: 999px;
        background: var(--border-strong);
        cursor: pointer;
        flex-shrink: 0;
        transition: background 120ms ease;
      }
      .aj-switch::after {
        content: "";
        position: absolute; top: 2px; left: 2px;
        width: 16px; height: 16px;
        background: var(--surface);
        border-radius: 50%;
        transition: transform 140ms cubic-bezier(0.2,0.8,0.2,1);
        box-shadow: 0 1px 2px rgba(0,0,0,0.18);
      }
      .aj-switch.on { background: var(--teal-500); }
      .aj-switch.on::after { transform: translateX(16px); }
      .aj-switch.disabled { opacity: 0.4; cursor: not-allowed; }

      .aj-conditional {
        background: var(--violet-50);
        border-radius: var(--r-md);
        padding: 14px 16px;
        display: flex; flex-direction: column; gap: 8px;
        animation: aj-grow 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }
      .aj-conditional .hint { font-size: 12px; color: var(--ink-muted); margin: 0; }
      @keyframes aj-grow {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .aj-num-with-unit {
        display: flex; gap: 8px; align-items: stretch;
      }
      .aj-num-with-unit .input { flex: 1; }
      .aj-unit-pill {
        display: inline-flex; align-items: center;
        padding: 0 12px;
        font-size: 12px; color: var(--ink-muted);
        background: var(--page-bg);
        border: 1px solid var(--border-strong);
        border-radius: var(--r-md);
        min-width: 64px; justify-content: center;
      }

      /* Próximamente subsection */
      .aj-proximo {
        margin-top: 12px;
        background: var(--page-bg);
        border: 1px dashed var(--border-strong);
        border-radius: var(--r-md);
        padding: 16px;
      }
      .aj-proximo-head {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .aj-proximo-titles h4 {
        font-size: 13px; color: var(--ink); font-weight: 500;
        margin: 0 0 3px;
      }
      .aj-proximo-titles .hint {
        font-size: 12px; color: var(--ink-muted);
        margin: 0;
      }
      .aj-soon-badge {
        font-size: 10px; font-weight: 500;
        padding: 3px 9px;
        background: var(--lavender);
        color: var(--violet-700);
        border-radius: 999px;
        text-transform: uppercase; letter-spacing: 0.05em;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .aj-proximo-body {
        border: 0; padding: 0; margin: 0;
        display: flex; flex-direction: column; gap: 10px;
        opacity: 0.55;
        cursor: not-allowed;
      }
      .aj-proximo-body > * { pointer-events: none; }

      /* Socios table */
      .aj-socios-table, .aj-users-table {
        border: 1px solid var(--border-strong);
        border-radius: 10px;
        overflow: hidden;
        background: var(--surface);
      }
      .aj-socios-table table, .aj-users-table table {
        width: 100%; border-collapse: collapse;
      }
      .aj-socios-table thead th, .aj-users-table thead th {
        text-align: left;
        padding: 10px 14px;
        font-size: 11px; font-weight: 500;
        text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-muted);
        background: var(--page-bg);
        border-bottom: 1px solid var(--border);
      }
      .aj-socios-table thead th.num,
      .aj-users-table thead th.num { text-align: right; }
      .aj-socios-table thead th.center,
      .aj-users-table thead th.center { text-align: center; }
      .aj-socios-table tbody td,
      .aj-users-table tbody td {
        padding: 0;
        border-bottom: 1px solid var(--border);
      }
      .aj-socios-table tbody tr:last-child td,
      .aj-users-table tbody tr:last-child td { border-bottom: 0; }
      .aj-socios-table tbody td.center,
      .aj-users-table tbody td.center { text-align: center; padding: 10px; }
      .aj-socios-table tbody td .prov-input,
      .aj-users-table tbody td .prov-input {
        width: 100%;
        border: 0; background: transparent;
        font-family: var(--font-sans); font-size: 13px;
        color: var(--ink);
        padding: 12px 14px;
        outline: none;
      }
      .aj-socios-table tbody td .prov-input.num {
        text-align: right; font-variant-numeric: tabular-nums;
      }
      .aj-socios-table tbody td .prov-input:focus { background: var(--teal-100); }
      .aj-socios-table tbody tr.off td,
      .aj-users-table tbody tr.off td { opacity: 0.5; }

      .aj-pct-cell {
        display: flex; align-items: center;
        padding-right: 14px;
      }
      .aj-pct-cell .prov-input.num { padding-right: 6px; }
      .aj-pct-unit { color: var(--ink-muted); font-size: 13px; }

      .aj-sum-indicator {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 13px;
        padding: 6px 12px;
        border-radius: 999px;
      }
      .aj-sum-indicator .dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: currentColor;
      }
      .aj-sum-indicator.ok  { background: var(--mint);     color: #1F5A3E; }
      .aj-sum-indicator.err { background: var(--coral-50); color: var(--coral-500); }
      .aj-sum-err-hint { font-size: 12px; opacity: 0.85; }

      /* Users */
      .aj-user-cell {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 14px;
      }
      .aj-user-avatar {
        width: 32px; height: 32px;
        border-radius: 10px;
        font-size: 12px; font-weight: 500;
        display: grid; place-items: center;
        flex-shrink: 0;
        letter-spacing: -0.01em;
      }
      .aj-user-name {
        font-weight: 500; color: var(--ink);
        font-size: 14px;
      }
      .aj-users-table tbody td .select {
        width: 100%;
        border: 0; background: transparent;
        font-family: var(--font-sans); font-size: 13px;
        color: var(--ink);
        padding: 12px 14px;
        outline: none;
        border-radius: 0;
      }
      .aj-users-table tbody td .select:focus { background: var(--teal-100); }
      .aj-users-table tbody td .select:disabled { color: var(--ink-muted); cursor: not-allowed; }
      .aj-users-table tbody td:not(.center):first-child { padding: 0; }
      .aj-users-table tbody td:nth-child(2) { padding: 10px 14px; }

      .aj-add-user {
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
        font-family: var(--font-sans);
      }
      .aj-add-user:hover { background: var(--violet-50); border-color: var(--violet-700); }
      .aj-add-user svg { width: 14px; height: 14px; }

      /* Cuenta */
      .aj-password-row {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        background: var(--page-bg);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
      }
      .aj-password-row .t { font-size: 13px; font-weight: 500; color: var(--ink); }
      .aj-password-row .h { font-size: 12px; color: var(--ink-muted); margin-top: 2px; }

      .aj-appearance-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      }
      .aj-theme-card {
        display: grid;
        grid-template-columns: 56px 1fr 18px;
        gap: 12px;
        align-items: center;
        padding: 12px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        cursor: not-allowed;
      }
      .aj-theme-card .prev {
        width: 56px; height: 40px;
        border-radius: 8px;
        border: 1px solid var(--border-strong);
      }
      .aj-theme-card .prev.light {
        background: linear-gradient(160deg, #FFFFFF 0%, #F1EEF4 100%);
      }
      .aj-theme-card .prev.dark {
        background: linear-gradient(160deg, #1C1A1E 0%, #2D2832 100%);
      }
      .aj-theme-card .t {
        display: block;
        font-size: 13px; font-weight: 500; color: var(--ink);
      }
      .aj-theme-card .h {
        display: block;
        font-size: 12px; color: var(--ink-muted);
        margin-top: 2px;
      }
    `}</style>
  );
}

Object.assign(window, { AjustesScreen });
