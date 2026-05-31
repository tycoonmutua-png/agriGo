import { useState, useEffect } from "react";
import API from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import "./Dashboard.css";

const KES = (n) => `KES ${Number(n || 0).toLocaleString()}`;

export default function Dashboard() {
  const [products, setProducts]     = useState([]);
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("overview");

  useEffect(() => {
    Promise.all([
      API.get("/api/products").catch(() => ({ data: [] })),
      API.get("/api/orders").catch(() => ({ data: [] })),
    ]).then(([p, o]) => {
      setProducts(Array.isArray(p.data) ? p.data : []);
      setOrders(Array.isArray(o.data) ? o.data : []);
      setLoading(false);
    });
  }, []);

  // Derived metrics
  const totalProducts  = products.length;
  const totalRevenue   = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalOrders    = orders.length;
  const totalCustomers = [...new Set(orders.map(o => o.userId))].length;
  const pendingOrders  = orders.filter(o => o.status === "pending").length;
  const lowStock       = products.filter(p => p.stock <= 10 && p.stock > 0);
  const outOfStock     = products.filter(p => p.stock === 0);
  const avgOrderValue  = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Category breakdown
  const catMap = {};
  products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1; });
  const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // Revenue by category
  const revCatMap = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const cat = item.category || "Other";
      revCatMap[cat] = (revCatMap[cat] || 0) + (item.price * item.qty || 0);
    });
  });
  const revByCat = Object.entries(revCatMap).map(([name, value]) => ({ name, value }));

  // Monthly sales (last 6 months)
  const monthlyMap = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", { month: "short" });
    monthlyMap[key] = { month: key, revenue: 0, orders: 0 };
  }
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = d.toLocaleString("default", { month: "short" });
    if (monthlyMap[key]) {
      monthlyMap[key].revenue += o.totalAmount || 0;
      monthlyMap[key].orders  += 1;
    }
  });
  const monthlyData = Object.values(monthlyMap);

  // Order status breakdown
  const statusMap = {};
  orders.forEach(o => { statusMap[o.status || "unknown"] = (statusMap[o.status || "unknown"] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Top products by stock value
  const topProducts = [...products]
    .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
    .slice(0, 5);

  // Recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const PIE_COLORS  = ["#4ade80","#22d3ee","#f59e0b","#f87171","#a78bfa","#34d399"];
  const STATUS_COLOR = { pending:"#f59e0b", completed:"#4ade80", cancelled:"#ef4444", processing:"#22d3ee" };

  const getStockBadge = (stock) => {
    if (stock === 0) return <span className="db-badge db-badge--red">Out of Stock</span>;
    if (stock <= 10) return <span className="db-badge db-badge--amber">Low Stock</span>;
    return <span className="db-badge db-badge--green">In Stock</span>;
  };

  if (loading) return (
    <div className="db-loading">
      <div className="db-spinner" />
      <p>Loading dashboard…</p>
    </div>
  );

  return (
    <div className="db-page">

      {/* ── TOP BAR ── */}
      <div className="db-topbar">
        <div>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-subtitle">Welcome back — here's what's happening on your farm store</p>
        </div>
        <div className="db-topbar-right">
          <span className="db-date">{new Date().toLocaleDateString("en-KE",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</span>
        </div>
      </div>

      {/* ── ALERT BANNER ── */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="db-alert">
          <span>⚠️</span>
          <span>
            {outOfStock.length > 0 && <><strong>{outOfStock.length} product(s)</strong> out of stock. </>}
            {lowStock.length > 0 && <><strong>{lowStock.length} product(s)</strong> running low.</>}
            &nbsp;Check inventory below.
          </span>
        </div>
      )}

      {/* ── KPI CARDS ── */}
      <div className="db-kpis">
        {[
          { icon:"📦", label:"Total Products",   value: totalProducts,         sub: `${outOfStock.length} out of stock`,      color:"green"  },
          { icon:"🛒", label:"Total Orders",     value: totalOrders,           sub: `${pendingOrders} pending`,              color:"cyan"   },
          { icon:"💰", label:"Total Revenue",    value: KES(totalRevenue),     sub: `Avg ${KES(avgOrderValue)} / order`,     color:"amber"  },
          { icon:"👥", label:"Customers",        value: totalCustomers,        sub: "Unique buyers",                         color:"purple" },
          { icon:"⚠️", label:"Low Stock Items",  value: lowStock.length,       sub: "Need restocking",                      color:"red"    },
          { icon:"📈", label:"Avg Order Value",  value: KES(avgOrderValue),    sub: "Per transaction",                       color:"teal"   },
        ].map((k,i) => (
          <div className={`db-kpi db-kpi--${k.color}`} key={i} style={{animationDelay:`${i*0.07}s`}}>
            <div className="db-kpi-icon">{k.icon}</div>
            <div className="db-kpi-body">
              <p className="db-kpi-label">{k.label}</p>
              <p className="db-kpi-value">{k.value}</p>
              <p className="db-kpi-sub">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="db-tabs">
        {["overview","inventory","orders"].map(t => (
          <button key={t} className={`db-tab ${activeTab===t?"db-tab--active":""}`} onClick={()=>setActiveTab(t)}>
            {t==="overview"?"📊 Overview":t==="inventory"?"📦 Inventory":"🛒 Orders"}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════
          TAB: OVERVIEW
      ════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="db-section-grid">

          {/* Monthly Revenue Trend */}
          <div className="db-card db-card--wide">
            <h2 className="db-card-title">📈 Revenue Trend (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e4022" />
                <XAxis dataKey="month" stroke="#6b9470" tick={{fontSize:12}} />
                <YAxis stroke="#6b9470" tick={{fontSize:12}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{background:"#0f2210",border:"1px solid #1e4022",borderRadius:"10px",color:"#f0fdf4"}}
                  formatter={v=>[KES(v),"Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Orders */}
          <div className="db-card">
            <h2 className="db-card-title">🛒 Monthly Orders</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e4022" />
                <XAxis dataKey="month" stroke="#6b9470" tick={{fontSize:11}} />
                <YAxis stroke="#6b9470" tick={{fontSize:11}} />
                <Tooltip contentStyle={{background:"#0f2210",border:"1px solid #1e4022",borderRadius:"10px",color:"#f0fdf4"}} />
                <Bar dataKey="orders" fill="#22d3ee" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Products by Category */}
          <div className="db-card">
            <h2 className="db-card-title">🌱 Products by Category</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{background:"#0f2210",border:"1px solid #1e4022",borderRadius:"10px",color:"#f0fdf4"}} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="db-empty">No product data yet</div>}
          </div>

          {/* Order Status */}
          <div className="db-card">
            <h2 className="db-card-title">📋 Order Status Breakdown</h2>
            {statusData.length > 0 ? (
              <div className="db-status-list">
                {statusData.map((s,i) => (
                  <div className="db-status-row" key={i}>
                    <span className="db-status-dot" style={{background: STATUS_COLOR[s.name] || "#6b9470"}} />
                    <span className="db-status-name">{s.name}</span>
                    <div className="db-status-bar-wrap">
                      <div className="db-status-bar" style={{
                        width:`${(s.value/totalOrders)*100}%`,
                        background: STATUS_COLOR[s.name] || "#6b9470"
                      }}/>
                    </div>
                    <span className="db-status-count">{s.value}</span>
                  </div>
                ))}
              </div>
            ) : <div className="db-empty">No orders yet</div>}
          </div>

          {/* Top Products by Value */}
          <div className="db-card db-card--wide">
            <h2 className="db-card-title">🏆 Top Products by Inventory Value</h2>
            {topProducts.length > 0 ? (
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Value</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p,i) => (
                      <tr key={p._id}>
                        <td className="db-table-rank">#{i+1}</td>
                        <td className="db-table-name">{p.name}</td>
                        <td><span className="db-cat-pill">{p.category}</span></td>
                        <td>{KES(p.price)}</td>
                        <td>{p.stock} {p.unit || "units"}</td>
                        <td className="db-table-value">{KES(p.price * p.stock)}</td>
                        <td>{getStockBadge(p.stock)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="db-empty">No products yet</div>}
          </div>

        </div>
      )}

      {/* ════════════════════════════════
          TAB: INVENTORY
      ════════════════════════════════ */}
      {activeTab === "inventory" && (
        <div className="db-section-grid">

          {/* Stock Alerts */}
          {(lowStock.length > 0 || outOfStock.length > 0) && (
            <div className="db-card db-card--wide">
              <h2 className="db-card-title">🚨 Stock Alerts</h2>
              <div className="db-alerts-grid">
                {[...outOfStock, ...lowStock].map(p => (
                  <div className={`db-alert-item ${p.stock === 0 ? "db-alert-item--red" : "db-alert-item--amber"}`} key={p._id}>
                    <span className="db-alert-icon">{p.stock === 0 ? "❌" : "⚠️"}</span>
                    <div>
                      <p className="db-alert-name">{p.name}</p>
                      <p className="db-alert-stock">{p.stock === 0 ? "Out of stock" : `${p.stock} ${p.unit||"units"} left`}</p>
                    </div>
                    {getStockBadge(p.stock)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Inventory Table */}
          <div className="db-card db-card--wide">
            <h2 className="db-card-title">📦 Full Inventory</h2>
            {products.length > 0 ? (
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr><th>Product</th><th>Category</th><th>Price/Unit</th><th>Stock</th><th>Stock Value</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id}>
                        <td className="db-table-name">
                          <div>{p.name}</div>
                          {p.description && <div className="db-table-desc">{p.description}</div>}
                        </td>
                        <td><span className="db-cat-pill">{p.category}</span></td>
                        <td>{KES(p.price)} / {p.unit||"unit"}</td>
                        <td>
                          <div className="db-stock-cell">
                            <span>{p.stock}</span>
                            <div className="db-mini-bar-wrap">
                              <div className="db-mini-bar" style={{
                                width:`${Math.min((p.stock/100)*100,100)}%`,
                                background: p.stock===0?"#ef4444":p.stock<=10?"#f59e0b":"#4ade80"
                              }}/>
                            </div>
                          </div>
                        </td>
                        <td>{KES(p.price * p.stock)}</td>
                        <td>{getStockBadge(p.stock)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="db-empty">No products in inventory</div>}
          </div>

          {/* Category Revenue */}
          {revByCat.length > 0 && (
            <div className="db-card">
              <h2 className="db-card-title">💰 Revenue by Category</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revByCat} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e4022" />
                  <XAxis type="number" stroke="#6b9470" tick={{fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                  <YAxis type="category" dataKey="name" stroke="#6b9470" tick={{fontSize:11}} width={80}/>
                  <Tooltip contentStyle={{background:"#0f2210",border:"1px solid #1e4022",borderRadius:"10px",color:"#f0fdf4"}} formatter={v=>[KES(v)]}/>
                  <Bar dataKey="value" radius={[0,6,6,0]}>
                    {revByCat.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      )}

      {/* ════════════════════════════════
          TAB: ORDERS
      ════════════════════════════════ */}
      {activeTab === "orders" && (
        <div className="db-section-grid">

          {/* Order Stats */}
          <div className="db-card db-card--wide">
            <div className="db-order-stats">
              {Object.entries(statusMap).map(([status, count],i) => (
                <div className="db-order-stat" key={i}>
                  <div className="db-order-stat-dot" style={{background: STATUS_COLOR[status]||"#6b9470"}}/>
                  <div>
                    <p className="db-order-stat-count">{count}</p>
                    <p className="db-order-stat-label">{status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="db-card db-card--wide">
            <h2 className="db-card-title">🛒 Recent Orders</h2>
            {recentOrders.length > 0 ? (
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(o => (
                      <tr key={o._id}>
                        <td className="db-table-id">#{String(o._id).slice(-6).toUpperCase()}</td>
                        <td>{o.customerName || o.userId || "—"}</td>
                        <td>{(o.items||[]).length} item(s)</td>
                        <td className="db-table-value">{KES(o.totalAmount)}</td>
                        <td>
                          <span className="db-status-pill" style={{
                            background: `${STATUS_COLOR[o.status]||"#6b9470"}22`,
                            color: STATUS_COLOR[o.status]||"#6b9470",
                            border: `1px solid ${STATUS_COLOR[o.status]||"#6b9470"}55`
                          }}>
                            {o.status || "unknown"}
                          </span>
                        </td>
                        <td className="db-table-date">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-KE") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="db-empty">No orders yet</div>}
          </div>

        </div>
      )}

    </div>
  );
}