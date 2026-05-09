import { useState, useEffect } from "react";
import API from "../services/api";
import "./SharedPage.css";

const STATUS_COLOR = {
  pending:    { bg: "rgba(255,176,32,0.1)",  color: "#ffb020", border: "rgba(255,176,32,0.3)"  },
  processing: { bg: "rgba(0,212,255,0.1)",   color: "#00d4ff", border: "rgba(0,212,255,0.3)"   },
  completed:  { bg: "rgba(61,220,110,0.1)",  color: "#3ddc6e", border: "rgba(61,220,110,0.3)"  },
  cancelled:  { bg: "rgba(255,77,77,0.1)",   color: "#ff4d4d", border: "rgba(255,77,77,0.3)"   },
};

const KES = (n) => `KES ${Number(n || 0).toLocaleString()}`;

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    API.get("/orders")
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchSearch = !search ||
      String(o._id).toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status || "pending"] = (acc[o.status || "pending"] || 0) + 1;
    return acc;
  }, {});

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}`, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch { alert("Failed to update order status"); }
  };

  if (loading) return <div className="sp-loading"><div className="sp-spinner"/><p>Loading orders…</p></div>;

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Orders</h1>
          <p className="sp-sub">Manage and track all customer orders</p>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="sp-filter-row">
        {["all", "pending", "processing", "completed", "cancelled"].map(s => (
          <button
            key={s}
            className={`sp-pill ${filter === s ? "sp-pill--active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "All Orders" : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="sp-pill-count">{s === "all" ? orders.length : (statusCounts[s] || 0)}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="sp-search-wrap">
        <svg className="sp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="sp-search"
          placeholder="Search by order ID or customer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="sp-empty">
          <div className="sp-empty-icon">🛒</div>
          <p>No orders found</p>
        </div>
      ) : (
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => {
                const sc = STATUS_COLOR[o.status] || STATUS_COLOR.pending;
                return (
                  <tr key={o._id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <td><span className="sp-mono">#{String(o._id).slice(-8).toUpperCase()}</span></td>
                    <td>{o.customerName || o.userId || "—"}</td>
                    <td>{(o.items || []).length} item(s)</td>
                    <td><span className="sp-value">{KES(o.totalAmount)}</span></td>
                    <td>
                      <span className="sp-status-pill" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                        {o.status || "pending"}
                      </span>
                    </td>
                    <td><span className="sp-dim">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-KE") : "—"}</span></td>
                    <td>
                      <select
                        className="sp-select"
                        value={o.status || "pending"}
                        onChange={e => updateStatus(o._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}