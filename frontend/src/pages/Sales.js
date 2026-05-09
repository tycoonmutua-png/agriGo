import { useState, useEffect } from "react";
import API from "../services/api";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import "./SharedPage.css";

const KES  = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const COLORS = ["#3ddc6e","#00d4ff","#ffb020","#ff4d4d","#b388ff","#00e5c0"];

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

  // Monthly data
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
      monthlyMap[key].revenue  += o.totalAmount || 0;
      monthlyMap[key].orders   += 1;
      if (o.userId) monthlyMap[key].customers.add(o.userId);
    }
  });
  const monthlyData = Object.values(monthlyMap).map(m => ({
    ...m, customers: m.customers.size
  }));

  // Category sales
  const catMap = {};
  orders.forEach(o => (o.items || []).forEach(item => {
    const cat = item.category || "Other";
    catMap[cat] = (catMap[cat] || 0) + (item.price * item.qty || 0);
  }));
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // Top products
  const prodMap = {};
  orders.forEach(o => (o.items || []).forEach(item => {
    const id = item.productId || item.name;
    if (!prodMap[id]) prodMap[id] = { name: item.name || id, qty: 0, revenue: 0 };
    prodMap[id].qty     += item.qty || 0;
    prodMap[id].revenue += (item.price * item.qty) || 0;
  }));
  const topProds = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Totals for selected range
  const totalRevenue  = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalOrders   = monthlyData.reduce((s, m) => s + m.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const tooltipStyle = { background:"#0c1a0d", border:"1px solid #1a3a1c", borderRadius:"10px", color:"#e8f5e9" };

  if (loading) return <div className="sp-loading"><div className="sp-spinner"/><p>Loading reports…</p></div>;

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Sales & Reports</h1>
          <p className="sp-sub">Analytics and performance insights for Agrigo</p>
        </div>
        <div className="sp-range-tabs">
          {["3m","6m","12m"].map(r => (
            <button key={r} className={`sp-range-btn ${range===r?"sp-range-btn--active":""}`} onClick={()=>setRange(r)}>
              {r === "3m" ? "3 Months" : r === "6m" ? "6 Months" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="sp-kpi-row">
        {[
          { label:"Revenue",        value: KES(totalRevenue),  color:"green"  },
          { label:"Orders",         value: totalOrders,         color:"cyan"   },
          { label:"Avg Order",      value: KES(avgOrderValue), color:"amber"  },
          { label:"Products",       value: products.length,    color:"purple" },
        ].map((k,i) => (
          <div className={`sp-kpi sp-kpi--${k.color}`} key={i}>
            <p className="sp-kpi-label">{k.label}</p>
            <p className="sp-kpi-value">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Area Chart */}
      <div className="sp-chart-card sp-chart-card--wide">
        <h2 className="sp-chart-title">Revenue Over Time</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3ddc6e" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#3ddc6e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a1c"/>
            <XAxis dataKey="month" stroke="#8aab8c" tick={{fontSize:11, fontFamily:"DM Mono, monospace"}}/>
            <YAxis stroke="#8aab8c" tick={{fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
            <Tooltip contentStyle={tooltipStyle} formatter={v=>[KES(v),"Revenue"]}/>
            <Area type="monotone" dataKey="revenue" stroke="#3ddc6e" strokeWidth={2.5} fill="url(#rg)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="sp-charts-row">
        {/* Orders Bar */}
        <div className="sp-chart-card">
          <h2 className="sp-chart-title">Orders per Month</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a1c"/>
              <XAxis dataKey="month" stroke="#8aab8c" tick={{fontSize:10}}/>
              <YAxis stroke="#8aab8c" tick={{fontSize:10}}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Bar dataKey="orders" fill="#00d4ff" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="sp-chart-card">
          <h2 className="sp-chart-title">Revenue by Category</h2>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value"
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {catData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v=>[KES(v)]}/>
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="sp-empty-sm">No sales data yet</div>}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="sp-chart-card sp-chart-card--wide">
        <h2 className="sp-chart-title">Top Selling Products</h2>
        {topProds.length > 0 ? (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr><th>Rank</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {topProds.map((p,i) => (
                  <tr key={i}>
                    <td><span className="sp-rank">#{i+1}</span></td>
                    <td>{p.name}</td>
                    <td>{p.qty}</td>
                    <td><span className="sp-value">{KES(p.revenue)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="sp-empty-sm">No sales recorded yet</div>}
      </div>
    </div>
  );
}