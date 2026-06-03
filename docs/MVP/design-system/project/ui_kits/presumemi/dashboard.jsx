/* global React, I, Card, Badge, PageHead, money, moneyShort, PRESUPUESTOS, INSUMOS, STATUS_TONES */

function DashboardScreen({ onOpenPresupuesto, onNavigate }) {
  return (
    <>
      <PageHead title="Hola, Deni" sub="Esto es lo que pasa hoy en MemyDeni.">
        <button className="btn btn-secondary" onClick={() => onNavigate("finanzas")}>
          <I.download /> Exportar reporte
        </button>
        <button className="btn btn-primary" onClick={() => onOpenPresupuesto(null)}>
          <I.plus /> Nuevo presupuesto
        </button>
      </PageHead>

      {/* KPI row */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <Card>
          <div className="eyebrow">Ingresos · este mes</div>
          <div className="kpi" style={{ marginTop: 6 }}>
            <div className="value">{moneyShort(24580)}</div>
            <div className="delta up"><I.arrowUp />+ 12% vs abril</div>
          </div>
        </Card>
        <Card highlight>
          <div className="eyebrow">Por cobrar</div>
          <div className="kpi" style={{ marginTop: 6 }}>
            <div className="value" style={{ color: "var(--violet-700)" }}>{moneyShort(6120)}</div>
            <div className="delta" style={{ color: "var(--violet-700)", opacity: 0.85 }}>
              3 presupuestos pendientes
            </div>
          </div>
        </Card>
        <Card>
          <div className="eyebrow">Insumos bajos</div>
          <div className="kpi" style={{ marginTop: 6 }}>
            <div className="value">4</div>
            <div className="delta down"><I.arrowDown />Revisar inventario</div>
          </div>
        </Card>
      </div>

      <div className="grid-2">
        {/* Recent presupuestos */}
        <Card style={{ padding: 0 }}>
          <div className="card-head" style={{ padding: "18px 20px 14px", margin: 0 }}>
            <h3>Presupuestos recientes</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("presupuestos")}>
              Ver todos <I.arrowRight />
            </button>
          </div>
          <table className="data-table">
            <tbody>
              {PRESUPUESTOS.slice(0, 5).map(p => {
                const s = STATUS_TONES[p.status];
                return (
                  <tr key={p.folio} onClick={() => onOpenPresupuesto(p.folio)}>
                    <td style={{ width: 80, color: "var(--ink-muted)" }}>{p.folio}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.client}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                        {p.event} · {p.date}
                      </div>
                    </td>
                    <td><Badge tone={s.tone} dot>{s.label}</Badge></td>
                    <td className="num" style={{ fontWeight: 500 }}>{money(p.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Insumos bajos */}
        <Card style={{ padding: 0 }}>
          <div className="card-head" style={{ padding: "18px 20px 14px", margin: 0 }}>
            <h3>Insumos bajos</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("insumos")}>
              Ver inventario <I.arrowRight />
            </button>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            {INSUMOS.filter(i => i.stock < i.min).map(i => {
              const pct = Math.min(100, (i.stock / i.min) * 100);
              const sev = i.stock < i.min * 0.5 ? "low" : "warn";
              return (
                <div key={i.name} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{i.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{i.cat}</div>
                    </div>
                    <div style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                      <div style={{ fontWeight: 500 }}>{i.stock} {i.unit}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>min {i.min}</div>
                    </div>
                  </div>
                  <div className={"stock-bar " + sev}>
                    <div style={{ width: pct + "%" }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Weekly chart */}
      <Card style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Ingresos por semana · últimas 8</h3>
          <Badge tone="violet">Mayo 2026</Badge>
        </div>
        <BarChart />
      </Card>
    </>
  );
}

function BarChart() {
  const data = [3200, 4100, 2900, 5400, 4800, 6200, 5800, 7100];
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 160, padding: "8px 4px 0" }}>
      {data.map((v, i) => {
        const h = (v / max) * 140;
        const last = i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 11, color: "var(--ink-muted)", fontVariantNumeric: "tabular-nums" }}>
              {moneyShort(v)}
            </div>
            <div style={{
              width: "100%", height: h, borderRadius: "6px 6px 0 0",
              background: last ? "var(--violet-700)" : "var(--lavender)"
            }} />
            <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>S{i + 1}</div>
          </div>
        );
      })}
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
