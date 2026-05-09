import { useState, useEffect } from "react";
import API from "../services/api";
import "./SharedPage.css";

const KES = (n) => `KES ${Number(n || 0).toLocaleString()}`;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    Promise.all([
      API.get("/users").catch(() => ({ data: [] })),
      API.get("/orders").catch(() => ({ data: [] })),
    ]).then(([u, o]) => {
      setCustomers(Array.isArray(u.data) ? u.data : []);
      setOrders(Array.isArray(o.data) ? o.data : []);
      setLoading(false);
    });
  }, []);

  // Enrich customers with order stats
  const enriched = customers
    .filter(c => c.role !== "admin")
    .map(c => {
      const userOrders = orders.filter(o => String(o.userId) === String(c._id));
      const totalSpent = userOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
      return { ...c, orderCount: userOrders.length, totalSpent };
    })
    .filter(c =>
      !search ||
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return <div className="sp-loading"><div className="sp-spinner"/><p>Loading customers…</p></div>;

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Customers</h1>
          <p className="sp-sub">{enriched.length} registered buyers on Agrigo</p>
        </div>
      </div>

      <div className="sp-search-wrap">
        <svg className="sp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="sp-search"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {enriched.length === 0 ? (
        <div className="sp-empty">
          <div className="sp-empty-icon">👥</div>
          <p>No customers found</p>
        </div>
      ) : (
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((c, i) => (
                <tr key={c._id} style={{ animationDelay: `${i * 0.04}s` }}>
                  <td>
                    <div className="sp-user-cell">
                      <div className="sp-avatar">
                        {(c.name || c.email || "?")[0].toUpperCase()}
                      </div>
                      <span>{c.name || "—"}</span>
                    </div>
                  </td>
                  <td><span className="sp-dim">{c.email || "—"}</span></td>
                  <td><span className="sp-dim">{c.phone || "—"}</span></td>
                  <td>
                    <span className="sp-badge">{c.orderCount}</span>
                  </td>
                  <td><span className="sp-value">{KES(c.totalSpent)}</span></td>
                  <td><span className="sp-dim">{c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-KE") : "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}