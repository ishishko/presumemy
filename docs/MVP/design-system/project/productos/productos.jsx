/* global React, I */
// Productos screen — rediseño del antiguo "Catálogo".
// Exporta solo el componente de pantalla + utilidades; el host (app.jsx o
// Productos.html) se encarga del Sidebar/Topbar y del mount.

const { useState, useMemo, useRef, useEffect } = React;

/* =========================================================
   Datos
   ========================================================= */
const PRODUCTOS_CATEGORIES = [
  "Box", "Golosinas", "Letras", "PaperCraft",
  "Banner", "Box 3D", "Aplique", "Tag", "Varios",
];

const PRODUCTOS_LIST = [
  // ---- Box (10xx) ----
  { code: 1001, name: "Box cumple básica 15×15",       cat: "Box",        medida: "15×15 cm",       stock: 32,  precioFinal: 180,  precioAmb: 145 },
  { code: 1002, name: "Box golosinera con asa",         cat: "Box",        medida: "12×12×9 cm",     stock: 14,  precioFinal: 210,  precioAmb: 170 },
  { code: 1003, name: "Box temática unicornio",         cat: "Box",        medida: "18×18 cm",       stock: 6,   precioFinal: 240,  precioAmb: 195 },
  { code: 1004, name: "Box neón rectangular",           cat: "Box",        medida: "20×14 cm",       stock: 22,  precioFinal: 195,  precioAmb: 160 },
  { code: 1005, name: "Box ventana corazón",            cat: "Box",        medida: "16×16 cm",       stock: 11,  precioFinal: 225,  precioAmb: 185 },

  // ---- Golosinas (20xx) ----
  { code: 2001, name: "Bombonera mini con tapa",        cat: "Golosinas",  medida: "7×7 cm",         stock: 84,  precioFinal: 65,   precioAmb: 50  },
  { code: 2002, name: "Vaso golosinero 240 ml",         cat: "Golosinas",  medida: "240 ml",         stock: 41,  precioFinal: 75,   precioAmb: 60  },
  { code: 2003, name: "Bolsa kraft con visor",          cat: "Golosinas",  medida: "10×18 cm",       stock: 130, precioFinal: 28,   precioAmb: 22  },
  { code: 2004, name: "Conito golosinero pack 12",      cat: "Golosinas",  medida: "12 u",           stock: 8,   precioFinal: 95,   precioAmb: 80  },
  { code: 2005, name: "Cajita pop corn rayada",         cat: "Golosinas",  medida: "9×9×10 cm",      stock: 56,  precioFinal: 55,   precioAmb: 45  },

  // ---- Letras (30xx) ----
  { code: 3001, name: "Letra 3D 30 cm",                 cat: "Letras",     medida: "30 cm",          stock: 24,  precioFinal: 320,  precioAmb: 265 },
  { code: 3002, name: "Nombre 5 letras chico",          cat: "Letras",     medida: "15 cm c/u",      stock: 4,   precioFinal: 850,  precioAmb: 700 },
  { code: 3003, name: "Topper letra cumple",            cat: "Letras",     medida: "10 cm",          stock: 130, precioFinal: 35,   precioAmb: 28  },
  { code: 3004, name: "Set «Feliz cumple» 11 letras",   cat: "Letras",     medida: "20 cm c/u",      stock: 3,   precioFinal: 1280, precioAmb: 1050 },

  // ---- PaperCraft (40xx) ----
  { code: 4001, name: "Centro de mesa unicornio",       cat: "PaperCraft", medida: "25×20 cm",       stock: 9,   precioFinal: 480,  precioAmb: 395 },
  { code: 4002, name: "Piñata papercraft estrella",     cat: "PaperCraft", medida: "35 cm",          stock: 5,   precioFinal: 620,  precioAmb: 510 },
  { code: 4003, name: "Caja sorpresa armable",          cat: "PaperCraft", medida: "20×20×20 cm",    stock: 18,  precioFinal: 295,  precioAmb: 240 },
  { code: 4023, name: "Figura 3D conejito",             cat: "PaperCraft", medida: "22 cm",          stock: 12,  precioFinal: 340,  precioAmb: 280 },
  { code: 4024, name: "Cubo decorativo 20 cm",          cat: "PaperCraft", medida: "20 cm",          stock: 27,  precioFinal: 180,  precioAmb: 145 },

  // ---- Banner (50xx) ----
  { code: 5001, name: "Banner «Feliz cumpleaños»",      cat: "Banner",     medida: "1.8 m",          stock: 36,  precioFinal: 220,  precioAmb: 180 },
  { code: 5002, name: "Banner nombre personalizado",    cat: "Banner",     medida: "hasta 8 letras", stock: 14,  precioFinal: 380,  precioAmb: 310 },
  { code: 5003, name: "Banderín pastel 3 m",            cat: "Banner",     medida: "3 m",            stock: 22,  precioFinal: 180,  precioAmb: 145 },
  { code: 5004, name: "Cartel bienvenida A2",           cat: "Banner",     medida: "42×59 cm",       stock: 7,   precioFinal: 260,  precioAmb: 210 },

  // ---- Box 3D (60xx) ----
  { code: 6001, name: "Box 3D unicornio",               cat: "Box 3D",     medida: "22×22×18 cm",    stock: 8,   precioFinal: 420,  precioAmb: 345 },
  { code: 6002, name: "Box 3D dinosaurio",              cat: "Box 3D",     medida: "24×18×20 cm",    stock: 4,   precioFinal: 460,  precioAmb: 380 },
  { code: 6003, name: "Box 3D corona princesa",         cat: "Box 3D",     medida: "20×20×16 cm",    stock: 11,  precioFinal: 395,  precioAmb: 325 },
  { code: 6004, name: "Box 3D estrella volumétrica",    cat: "Box 3D",     medida: "25 cm",          stock: 6,   precioFinal: 410,  precioAmb: 340 },
  { code: 6005, name: "Box 3D explosión sorpresa",      cat: "Box 3D",     medida: "18×18×18 cm",    stock: 2,   precioFinal: 580,  precioAmb: 480 },

  // ---- Aplique (70xx) ----
  { code: 7001, name: "Aplique torta nombre",           cat: "Aplique",    medida: "12 cm",          stock: 64,  precioFinal: 65,   precioAmb: 52  },
  { code: 7002, name: "Aplique flor pack 6",            cat: "Aplique",    medida: "8 cm",           stock: 38,  precioFinal: 90,   precioAmb: 72  },
  { code: 7003, name: "Aplique estrella dorada",        cat: "Aplique",    medida: "6 cm",           stock: 120, precioFinal: 30,   precioAmb: 24  },
  { code: 7004, name: "Aplique corazón pack 10",        cat: "Aplique",    medida: "5 cm",           stock: 88,  precioFinal: 45,   precioAmb: 36  },
  { code: 7005, name: "Aplique luna fase",              cat: "Aplique",    medida: "10 cm",          stock: 21,  precioFinal: 75,   precioAmb: 60  },

  // ---- Tag (80xx) ----
  { code: 8001, name: "Tag agradecimiento pack 20",     cat: "Tag",        medida: "5×3 cm",         stock: 200, precioFinal: 95,   precioAmb: 75  },
  { code: 8002, name: "Tag personalizado pack 30",      cat: "Tag",        medida: "6×4 cm",         stock: 76,  precioFinal: 140,  precioAmb: 115 },
  { code: 8003, name: "Tag invitación A6",              cat: "Tag",        medida: "10×15 cm",       stock: 48,  precioFinal: 60,   precioAmb: 48  },
  { code: 8004, name: "Tag souvenir circular",          cat: "Tag",        medida: "5 cm",           stock: 134, precioFinal: 40,   precioAmb: 32  },
  { code: 8005, name: "Tag fiesta pack mix",            cat: "Tag",        medida: "varios",         stock: 28,  precioFinal: 110,  precioAmb: 90  },

  // ---- Varios (90xx) ----
  { code: 9001, name: "Pajitas decoradas 25 u",         cat: "Varios",     medida: "21 cm",          stock: 42,  precioFinal: 80,   precioAmb: 65  },
  { code: 9002, name: "Topper bandera mini pack 6",     cat: "Varios",     medida: "8 cm",           stock: 95,  precioFinal: 55,   precioAmb: 45  },
  { code: 9003, name: "Sticker pack temático",          cat: "Varios",     medida: "A5",             stock: 60,  precioFinal: 70,   precioAmb: 56  },
  { code: 9004, name: "Mini cono dulces pack 10",       cat: "Varios",     medida: "10 cm",          stock: 18,  precioFinal: 85,   precioAmb: 70  },
];

const moneyProductos = (n) =>
  "$ " + n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/* =========================================================
   Iconos extra (placeholder de imagen, grid/lista, sort)
   ========================================================= */
const ProdIcons = {
  image: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-5-5L5 21"/>
    </svg>
  ),
  grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  list: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13"/>
      <circle cx="4" cy="6" r="0.8" fill="currentColor"/>
      <circle cx="4" cy="12" r="0.8" fill="currentColor"/>
      <circle cx="4" cy="18" r="0.8" fill="currentColor"/>
    </svg>
  ),
  sortAsc: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 15 6-6 6 6"/>
    </svg>
  ),
  sortDesc: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
};

/* =========================================================
   Heartbeat overlay (renderizado por el host cuando se dispara)
   ========================================================= */
function HeartbeatOverlay({ k }) {
  return (
    <div className="heartbeat-layer" aria-hidden="true" key={k}>
      <div className="heartbeat-pulse" />
      <div className="heartbeat-line">
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
   Productos screen
   ========================================================= */
function ProductosScreen({ onCreate, onOpenDetail }) {
  const [view, setView]     = useState("grid");        // "grid" | "list"
  const [filter, setFilter] = useState("Todos");
  const [sort, setSort]     = useState({ key: "code", dir: "asc" });

  /* Filtered + sorted rows --------------------------------- */
  const rows = useMemo(() => {
    const base = filter === "Todos"
      ? PRODUCTOS_LIST
      : PRODUCTOS_LIST.filter(p => p.cat === filter);
    const k = sort.key, dir = sort.dir === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      const va = a[k], vb = b[k];
      if (typeof va === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "es") * dir;
    });
  }, [filter, sort]);

  /* Column model for list view ----------------------------- */
  const initialCols = [
    { key: "thumb",       label: "",           width: 60,  sortable: false, num: false },
    { key: "code",        label: "Código",     width: 90,  sortable: true,  num: false },
    { key: "name",        label: "Nombre",     width: 280, sortable: true,  num: false },
    { key: "cat",         label: "Categoría",  width: 140, sortable: true,  num: false },
    { key: "medida",      label: "Medida",     width: 140, sortable: true,  num: false },
    { key: "stock",       label: "Stock",      width: 90,  sortable: true,  num: true  },
    { key: "precioFinal", label: "P. final",   width: 110, sortable: true,  num: true  },
    { key: "precioAmb",   label: "P. amb.",    width: 110, sortable: true,  num: true  },
  ];
  const [cols, setCols] = useState(initialCols);

  /* Column resize ----------------------------------------- */
  const resizingRef = useRef(null);
  const onResizeStart = (idx, e) => {
    e.preventDefault(); e.stopPropagation();
    resizingRef.current = { idx, startX: e.clientX, startWidth: cols[idx].width };
    document.body.classList.add("is-resizing");
    e.currentTarget.classList.add("dragging");
  };
  useEffect(() => {
    const onMove = (e) => {
      const r = resizingRef.current;
      if (!r) return;
      const delta = e.clientX - r.startX;
      const min = r.idx === 0 ? 48 : 70;
      const next = Math.max(min, r.startWidth + delta);
      setCols(cs => cs.map((c, i) => i === r.idx ? { ...c, width: next } : c));
    };
    const onUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = null;
      document.body.classList.remove("is-resizing");
      document.querySelectorAll(".resize-handle.dragging")
        .forEach(el => el.classList.remove("dragging"));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  /* Sort handler ------------------------------------------ */
  const onSort = (key) => {
    setSort(s => s.key === key
      ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
      : { key, dir: "asc" });
  };

  /* Header counts ----------------------------------------- */
  const sub = `${PRODUCTOS_LIST.length} productos · ${PRODUCTOS_CATEGORIES.length} categorías`;

  /* ------------------------------------------------------- */
  return (
    <>
      {/* PAGE HEAD */}
      <div className="page-head">
        <div className="title">
          <h1>Productos</h1>
          <div className="sub">{sub}</div>
        </div>
        <div className="actions prod-head-tools">
          <div className="view-toggle" role="tablist" aria-label="Vista">
            <button
              type="button"
              role="tab"
              aria-selected={view === "grid"}
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              <ProdIcons.grid /> Grid
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <ProdIcons.list /> Lista
            </button>
          </div>
          <button className="btn btn-primary" onClick={onCreate}>
            <I.plus /> Nuevo producto
          </button>
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="pill-row">
        <button
          className={"pill" + (filter === "Todos" ? " active" : "")}
          onClick={() => setFilter("Todos")}
        >Todos</button>
        {PRODUCTOS_CATEGORIES.map(c => (
          <button
            key={c}
            className={"pill" + (filter === c ? " active" : "")}
            onClick={() => setFilter(c)}
          >{c}</button>
        ))}
      </div>

      {/* CONTENT */}
      {rows.length === 0 ? (
        <div className="prod-empty">No hay productos en esta categoría.</div>
      ) : view === "grid" ? (
        <ProductGrid rows={rows} onOpen={onOpenDetail} />
      ) : (
        <ProductList
          rows={rows}
          cols={cols}
          sort={sort}
          onSort={onSort}
          onResizeStart={onResizeStart}
          onOpen={onOpenDetail}
        />
      )}
    </>
  );
}

/* ---------- Grid view ---------- */
function ProductGrid({ rows, onOpen }) {
  return (
    <div className="prod-grid">
      {rows.map(p => (
        <div
          key={p.code}
          className="prod-card"
          onDoubleClick={() => onOpen && onOpen(p)}
          title="Doble click para ver detalle"
        >
          <div className="prod-thumb"><ProdIcons.image /></div>
          <div className="prod-name">{p.name}</div>
          <div className="prod-meta-1">
            <span>{p.cat}</span>
            <span className="sep" />
            <span className="code">{p.code}</span>
          </div>
          <div className="prod-foot">
            <span className="stock">Stock <strong>{p.stock}</strong></span>
            <span className="price">{moneyProductos(p.precioFinal)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- List view ---------- */
function ProductList({ rows, cols, sort, onSort, onResizeStart, onOpen }) {
  const totalWidth = cols.reduce((s, c) => s + c.width, 0);
  return (
    <div className="list-wrap" style={{ overflowX: "auto" }}>
      <table className="list-table" style={{ width: totalWidth, minWidth: "100%" }}>
        <colgroup>
          {cols.map(c => <col key={c.key} style={{ width: c.width }} />)}
        </colgroup>
        <thead>
          <tr>
            {cols.map((c, idx) => {
              const sorted = sort.key === c.key;
              return (
                <th
                  key={c.key}
                  className={
                    (c.num ? "num " : "") +
                    (sorted ? "sorted" : "")
                  }
                >
                  {c.sortable ? (
                    <span className="th-inner" onClick={() => onSort(c.key)}>
                      <span>{c.label}</span>
                      <span className="sort-arrow">
                        {sorted && sort.dir === "desc" ? <ProdIcons.sortDesc /> : <ProdIcons.sortAsc />}
                      </span>
                    </span>
                  ) : (
                    <span>{c.label}</span>
                  )}
                  {idx < cols.length - 1 && (
                    <span
                      className="resize-handle"
                      onMouseDown={(e) => onResizeStart(idx, e)}
                    />
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr
              key={p.code}
              onDoubleClick={() => onOpen && onOpen(p)}
              title="Doble click para ver detalle"
            >
              <td>
                <div className="mini-thumb"><ProdIcons.image /></div>
              </td>
              <td className="code-cell">{p.code}</td>
              <td className="name-cell">{p.name}</td>
              <td className="cat-cell">{p.cat}</td>
              <td className="cat-cell">{p.medida}</td>
              <td className="num">{p.stock}</td>
              <td className="num price-final">{moneyProductos(p.precioFinal)}</td>
              <td className="num price-amb">{moneyProductos(p.precioAmb)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Expose to the global scope so app.jsx / standalone hosts can mount us. */
Object.assign(window, {
  ProductosScreen,
  ProductGrid,
  ProductList,
  HeartbeatOverlay,
  PRODUCTOS_LIST,
  PRODUCTOS_CATEGORIES,
  moneyProductos,
});
