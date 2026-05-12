import React, { useEffect, useState } from "react";
import API from "../services/api";

const STATUS_STYLES = {
  pending:    { bg: "rgba(255,176,32,0.12)",  color: "#ffb020", label: "Pending"    },
  processing: { bg: "rgba(0,212,255,0.12)",   color: "#00d4ff", label: "Processing" },
  completed:  { bg: "rgba(61,220,110,0.12)",  color: "#3ddc6e", label: "Completed"  },
  cancelled:  { bg: "rgba(255,77,77,0.12)",   color: "#ff4d4d", label: "Cancelled"  },
};

const PAYMENT_STYLES = {
  paid:    { color: "#3ddc6e", label: "✅ Paid"    },
  pending: { color: "#ffb020", label: "⏳ Pending" },
  failed:  { color: "#ff4d4d", label: "❌ Failed"  },
};

export default function MyReceipts() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    API.get("/orders/my-orders")
      .then(({ data }) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setError("Could not load your orders. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  return (
    <div style={{ padding: "32px 28px", maxWidth: 860, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#e8f5e9", marginBottom: 4 }}>
          🧾 My Receipts
        </h1>
        <p style={{ color: "#8aab8c", fontSize: "0.9rem" }}>
          View all your orders and payment history
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#8aab8c" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <p>Loading your orders…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)",
          borderRadius: 12, padding: "16px 20px", color: "#ff4d4d", marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "rgba(255,255,255,0.02)", borderRadius: 16,
          border: "1px solid #1a3a1c",
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
          <h3 style={{ color: "#e8f5e9", marginBottom: 8 }}>No orders yet</h3>
          <p style={{ color: "#8aab8c", marginBottom: 24 }}>
            Your purchases will appear here once you place an order.
          </p>
          <a href="/shop" style={{
            display: "inline-block", padding: "10px 24px", borderRadius: 10,
            background: "rgba(61,220,110,0.15)", color: "#3ddc6e",
            border: "1px solid rgba(61,220,110,0.3)", textDecoration: "none",
            fontWeight: 600, fontSize: "0.9rem",
          }}>
            Browse Products
          </a>
        </div>
      )}

      {/* Orders list */}
      {!loading && orders.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order) => {
            const st  = STATUS_STYLES[order.status]  || STATUS_STYLES.pending;
            const pay = PAYMENT_STYLES[order.payment?.status] || PAYMENT_STYLES.pending;
            const isOpen = expanded === order._id;

            return (
              <div key={order._id} style={{
                background: "#0c1a0d", borderRadius: 14,
                border: `1px solid ${isOpen ? "rgba(61,220,110,0.25)" : "#1a3a1c"}`,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}>

                {/* Row */}
                <button
                  onClick={() => toggle(order._id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    gap: 14, padding: "16px 20px", background: "none",
                    border: "none", cursor: "pointer", color: "#e8f5e9", textAlign: "left",
                  }}
                >
                  <span style={{
                    fontFamily: "monospace", fontSize: "0.78rem",
                    background: "rgba(61,220,110,0.1)", color: "#3ddc6e",
                    padding: "4px 8px", borderRadius: 6, flexShrink: 0,
                  }}>
                    #{(order._id || "").slice(-7).toUpperCase()}
                  </span>

                  <span style={{ color: "#8aab8c", fontSize: "0.85rem", flexShrink: 0 }}>
                    {fmt(order.createdAt)}
                  </span>

                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#3ddc6e", marginLeft: "auto" }}>
                    KES {(order.total || 0).toLocaleString()}
                  </span>

                  <span style={{
                    background: st.bg, color: st.color, fontSize: "0.75rem",
                    fontWeight: 600, padding: "4px 10px", borderRadius: 20, flexShrink: 0,
                  }}>
                    {st.label}
                  </span>

                  <span style={{ color: pay.color, fontSize: "0.82rem", flexShrink: 0 }}>
                    {pay.label}
                  </span>

                  <span style={{
                    color: "#8aab8c", fontSize: "0.8rem", flexShrink: 0,
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}>▼</span>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{
                    borderTop: "1px solid #1a3a1c", padding: "16px 20px",
                    display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    {(order.items || []).map((item, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 12px", background: "rgba(255,255,255,0.02)",
                        borderRadius: 8, border: "1px solid #1a3a1c",
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                            {item.name || "Product"}
                          </div>
                          <div style={{ color: "#8aab8c", fontSize: "0.8rem" }}>
                            Qty: {item.quantity}
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, color: "#3ddc6e" }}>
                          KES {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                        </div>
                      </div>
                    ))}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                      {order.deliveryMethod && (
                        <div style={{ color: "#8aab8c", fontSize: "0.82rem" }}>
                          🚚 <span style={{ color: "#e8f5e9" }}>{order.deliveryMethod}</span>
                        </div>
                      )}
                      {order.payment?.mpesaCode && (
                        <div style={{ color: "#8aab8c", fontSize: "0.82rem" }}>
                          M-Pesa: <span style={{ color: "#e8f5e9", fontFamily: "monospace" }}>{order.payment.mpesaCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}