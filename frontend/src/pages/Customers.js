import { useState, useEffect } from "react";
import API from "../services/api";
import "./Customers.css";

const KES = (n) => `KES ${Number(n || 0).toLocaleString()}`;

const AVATAR_COLORS = [
  "#16a34a", "#0ea5e9", "#8b5cf6", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

const getAvatarColor = (str) => {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [expanded, setExpanded]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      API.get("/api/users").catch(() => ({ data: [] })),
      API.get("/api/orders").catch(() => ({ data: [] })),
    ]).then(([u, o]) => {
      setCustomers(Array.isArray(u.data) ? u.data : []);
      setOrders(Array.isArray(o.data) ? o.data : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  // Only customers with at least one order
  const enriched = customers
    .filter(c => c.role !== "admin")
    .map(c => {
      const userOrders = orders.filter(o =>
        String(o.userId) === String(c._id) ||
        String(o.delivery?.phone) === String(c.phone)
      );
      const totalSpent = userOrders.reduce((s, o) => s + (o.total || o.totalAmount || 0), 0);
      const lastOrder  = [...userOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      return { ...c, orderCount: userOrders.length, totalSpent, lastOrder, userOrders };
    })
    .filter(c => c.orderCount > 0) // ← only with orders
    .filter(c =>
      !search ||
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search) ||
      (c.county || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const totalRevenue   = enriched.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrdersAll = enriched.reduce((s, c) => s + c.orderCount, 0);
  const topCustomer    = enriched[0];

  const toggleExpand = (id) => setExpanded(expanded === id ? null : id);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await API.delete(`/users/${id}`);
      setCustomers(prev => prev.filter(c => c._id !== id));
      setDeleteConfirm(null);
      setExpanded(null);
    } catch {
      alert("Failed to delete customer.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="cust-loading">
      <div className="cust-spinner" />
      <p>Loading customers…</p>
    </div>
  );

  return (
    <div className="cust-page">

      {/* ── HEADER ── */}
      <div className="cust-header">
        <div>
          <h1 className="cust-title">👥 Customers</h1>
          <p className="cust-sub">{enriched.length} customers with confirmed orders</p>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="cust-stats">
        <div className="cust-stat-card">
          <span className="cust-stat-icon">👥</span>
          <div>
            <div className="cust-stat-val">{enriched.length}</div>
            <div className="cust-stat-lbl">Active Customers</div>
          </div>
        </div>
        <div className="cust-stat-card">
          <span className="cust-stat-icon">🛒</span>
          <div>
            <div className="cust-stat-val">{totalOrdersAll}</div>
            <div className="cust-stat-lbl">Total Orders</div>
          </div>
        </div>
        <div className="cust-stat-card">
          <span className="cust-stat-icon">💰</span>
          <div>
            <div className="cust-stat-val cust-stat-val--green">{KES(totalRevenue)}</div>
            <div className="cust-stat-lbl">Total Revenue</div>
          </div>
        </div>
        <div className="cust-stat-card">
          <span className="cust-stat-icon">🏆</span>
          <div>
            <div className="cust-stat-val cust-stat-val--amber">
              {topCustomer ? (topCustomer.name || "—").split(" ")[0] : "—"}
            </div>
            <div className="cust-stat-lbl">Top Customer</div>
          </div>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="cust-toolbar">
        <div className="cust-search-wrap">
          <span className="cust-search-icon">🔍</span>
          <input
            className="cust-search"
            placeholder="Search by name, email, phone or county…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── EMPTY ── */}
      {enriched.length === 0 && (
        <div className="cust-empty">
          <div className="cust-empty-icon">🌾</div>
          <h3>No customers with orders yet</h3>
          <p>Customers appear here once they place their first order</p>
        </div>
      )}

      {/* ── CUSTOMER LIST ── */}
      <div className="cust-list">
        {enriched.map((c, i) => {
          const color      = getAvatarColor(c.name || c.email);
          const initial    = (c.name || c.email || "?")[0].toUpperCase();
          const isExpanded = expanded === c._id;

          return (
            <div
              key={c._id}
              className={`cust-card ${isExpanded ? "cust-card--expanded" : ""}`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* ── HEADER ROW ── */}
              <div className="cust-card-header" onClick={() => toggleExpand(c._id)}>
                <div className="cust-card-left">
                  {i < 3 && (
                    <span className="cust-rank">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </span>
                  )}
                  <div className="cust-avatar" style={{ background: color }}>{initial}</div>
                  <div className="cust-info">
                    <span className="cust-name">{c.name || "Unknown"}</span>
                    <span className="cust-email">{c.email || c.phone || "—"}</span>
                  </div>
                </div>

                <div className="cust-card-right">
                  <div className="cust-meta-item">
                    <span className="cust-meta-val">{c.orderCount}</span>
                    <span className="cust-meta-lbl">Orders</span>
                  </div>
                  <div className="cust-meta-item">
                    <span className="cust-meta-val cust-meta-val--green">{KES(c.totalSpent)}</span>
                    <span className="cust-meta-lbl">Spent</span>
                  </div>
                  <span className={`cust-role-badge cust-role-badge--${c.role || "customer"}`}>
                    {c.role || "customer"}
                  </span>
                  <button
                    className="cust-delete-btn"
                    title="Delete customer"
                    onClick={e => { e.stopPropagation(); setDeleteConfirm(c._id); }}
                  >
                    🗑️
                  </button>
                  <span className="cust-expand-icon">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* ── EXPANDED ── */}
              {isExpanded && (
                <div className="cust-card-body">
                  <div className="cust-detail-grid">

                    <div className="cust-detail-section">
                      <h4>📋 Contact Info</h4>
                      <div className="cust-detail-row"><span>Phone</span><span>{c.phone || "—"}</span></div>
                      <div className="cust-detail-row"><span>Email</span><span>{c.email || "—"}</span></div>
                      <div className="cust-detail-row"><span>County</span><span>{c.county || c.lastOrder?.delivery?.county || "—"}</span></div>
                      <div className="cust-detail-row"><span>Role</span><span>{c.role || "customer"}</span></div>
                      <div className="cust-detail-row"><span>Joined</span><span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-KE") : "—"}</span></div>
                      <div className="cust-detail-row"><span>Last Order</span><span>{c.lastOrder?.createdAt ? new Date(c.lastOrder.createdAt).toLocaleDateString("en-KE") : "—"}</span></div>
                    </div>

                    <div className="cust-detail-section">
                      <h4>🛒 Order History ({c.orderCount})</h4>
                      {c.userOrders.slice(0, 5).map((o, idx) => (
                        <div key={idx} className="cust-order-row">
                          <span className="cust-order-id">#{String(o._id).slice(-6).toUpperCase()}</span>
                          <span className="cust-order-date">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-KE") : "—"}</span>
                          <span className="cust-order-amount">{KES(o.total || o.totalAmount)}</span>
                          <span className="cust-order-status" style={{ color: o.status === "completed" ? "#4ade80" : o.status === "cancelled" ? "#ef4444" : "#f59e0b" }}>
                            {o.status || "pending"}
                          </span>
                        </div>
                      ))}
                      {c.userOrders.length > 5 && (
                        <p className="cust-more-orders">+{c.userOrders.length - 5} more orders</p>
                      )}
                      <button
                        className="cust-delete-full-btn"
                        onClick={() => setDeleteConfirm(c._id)}
                      >
                        🗑️ Delete Customer Account
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div className="cust-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="cust-modal" onClick={e => e.stopPropagation()}>
            <div className="cust-modal-icon">⚠️</div>
            <h2>Delete Customer?</h2>
            <p>This permanently deletes the account. Their order history stays in the Orders page.</p>
            <div className="cust-modal-actions">
              <button className="cust-modal-cancel" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="cust-modal-delete" onClick={() => handleDelete(deleteConfirm)} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}