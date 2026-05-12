import { useState, useEffect } from "react";
import API from "../services/api";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import "./Sales.css";

const KES    = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const COLORS = ["#4ade80","#22d3ee","#f59e0b","#ef4444","#a78bfa","#34d399"];

const tooltipStyle = {
  background: "#112613",
  border: "1px solid #1e4022",
  borderRadius: "10px",
  color: "#f0fdf4",
  fontSize: "13px",
};

export default function Sales() {
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [range, setRange]       = useState("6m");

  useEffect(() => {
    Promise.all([
      API.get("/orders").catch(() => ({ data: [] })),
      API.get("/products").catch(() => ({ data: [] })),
    ]).then(([o, p]) => {
      setOrders(Array.isArray(o.data) ? o.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setLoading(false);
    });
  }, []);

  const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;

  // ── Monthly data ──
  const monthlyMap = {};
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyMap[key] = { month: key, revenue: 0, orders: 0, customers: new Set() };
  }
  orders.forEach(o => {
    const d   = new Date(o.createdAt);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (monthlyMap[key]) {
      monthlyMap[key].revenue += o.total || o.totalAmount || 0;
      monthlyMap[key].orders  += 1;
      if (o.userId) monthlyMap[key].customers.add(o.userId);
    }
  });
  const monthlyData = Object.values(monthlyMap).map(m => ({
    ...m, customers: m.customers.size
  }));

  // ── Category sales ──
  const catMap = {};
  orders.forEach(o => (o.items || []).forEach(item => {
    const cat = item.category || "Other";
    catMap[cat] = (catMap[cat] || 0) + ((item.price * (item.qty || item.quantity)) || 0);
  }));
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // ── Top products ──
  const prodMap = {};
  orders.forEach(o => (o.items || []).forEach(item => {
    const id = item.productId || item.name || "unknown";
    if (!prodMap[id]) prodMap[id] = { name: item.name || id, qty: 0, revenue: 0 };
    prodMap[id].qty     += item.qty || item.quantity || 0;
    prodMap[id].revenue += ((item.price * (item.qty || item.quantity)) || 0);
  }));
  const topProds = Object.values(prodMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxRevenue = topProds.length > 0 ? topProds[0].revenue : 1;

  // ── Summary KPIs ──
  const totalRevenue  = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalOrders   = monthlyData.reduce((s, m) => s + m.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const lowStockCount = products.filter(p => p.stock <= 10).length;

  if (loading) return (
    <div className="sales-loading">
      <div className="sales-spinner" />
      <p>Loading reports…</p>
    </div>
  );

  return (
    <div className="sales-page">

      {/* ── HEADER ── */}
      <div className="sales-header">
        <div>
          <h1 className="sales-title">📊 Sales & Reports</h1>
          <p className="sales-sub">Analytics and performance insights for AgriGo</p>
        </div>
        <div className="sales-range-tabs">
          {["3m", "6m", "12m"].map(r => (
            <button
              key={r}
              className={`sales-range-btn ${range === r ? "sales-range-btn--active" : ""}`}
              onClick={() => setRange(r)}
            >
              {r === "3m" ? "3 Months" : r === "6m" ? "6 Months" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="sales-kpi-row">
        <div className="sales-kpi sales-kpi--green">
          <span className="sales-kpi-icon">💰</span>
          <p className="sales-kpi-label">Revenue</p>
          <p className="sales-kpi-value">{KES(totalRevenue)}</p>
        </div>
        <div className="sales-kpi sales-kpi--cyan">
          <span className="sales-kpi-icon">🛒</span>
          <p className="sales-kpi-label">Orders</p>
          <p className="sales-kpi-value">{totalOrders}</p>
        </div>
        <div className="sales-kpi sales-kpi--amber">
          <span className="sales-kpi-icon">📈</span>
          <p className="sales-kpi-label">Avg Order</p>
          <p className="sales-kpi-value">{KES(avgOrderValue)}</p>
        </div>
        <div className="sales-kpi sales-kpi--purple">
          <span className="sales-kpi-icon">⚠️</span>
          <p className="sales-kpi-label">Low Stock</p>
          <p className="sales-kpi-value">{lowStockCount} items</p>
        </div>
      </div>

      {/* ── REVENUE AREA CHART ── */}
      <div className="sales-chart-card">
        <h2 className="sales-chart-title">📈 Revenue Over Time</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e4022" />
            <XAxis dataKey="month" stroke="#6b9470" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b9470" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [KES(v), "Revenue"]} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4ade80"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── ORDERS + CATEGORY CHARTS ── */}
      <div className="sales-charts-row">

        {/* Orders Bar Chart */}
        <div className="sales-chart-card" style={{ marginBottom: 0 }}>
          <h2 className="sales-chart-title">🗓️ Orders per Month</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e4022" />
              <XAxis dataKey="month" stroke="#6b9470" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b9470" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="orders" fill="#22d3ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="sales-chart-card" style={{ marginBottom: 0 }}>
          <h2 className="sales-chart-title">🥧 Revenue by Category</h2>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={catData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={40}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {catData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => [KES(v)]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="sales-empty-sm">No sales data yet</div>
          )}
        </div>

      </div>

      {/* ── TOP PRODUCTS TABLE ── */}
      <div className="sales-chart-card">
        <h2 className="sales-chart-title">🏆 Top Selling Products</h2>
        {topProds.length > 0 ? (
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {topProds.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`sales-rank sales-rank--${i < 3 ? i + 1 : "other"}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td>{p.name}</td>
                    <td><span className="sales-qty">{p.qty}</span></td>
                    <td><span className="sales-value">{KES(p.revenue)}</span></td>
                    <td>
                      <div className="sales-bar-wrap">
                        <div className="sales-bar-bg">
                          <div
                            className="sales-bar-fill"
                            style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                          />
                        </div>
                        <span style={{ fontSize: "11px", color: "#6b9470", whiteSpace: "nowrap" }}>
                          {((p.revenue / maxRevenue) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sales-empty-sm">No sales recorded yet — start selling to see data here</div>
        )}
      </div>

    </div>
  );
}