import { useState, useEffect } from "react";
import API from "../services/api";
import "./Orders.css";

const STATUS_COLOR = {
  pending:    { bg: "rgba(255,176,32,0.1)",  color: "#ffb020", border: "rgba(255,176,32,0.3)"  },
  processing: { bg: "rgba(0,212,255,0.1)",   color: "#00d4ff", border: "rgba(0,212,255,0.3)"   },
  completed:  { bg: "rgba(61,220,110,0.1)",  color: "#3ddc6e", border: "rgba(61,220,110,0.3)"  },
  cancelled:  { bg: "rgba(255,77,77,0.1)",   color: "#ff4d4d", border: "rgba(255,77,77,0.3)"   },
};

const PAYMENT_COLOR = {
  paid:    { bg: "rgba(61,220,110,0.1)",  color: "#3ddc6e", border: "rgba(61,220,110,0.3)"  },
  pending: { bg: "rgba(255,176,32,0.1)",  color: "#ffb020", border: "rgba(255,176,32,0.3)"  },
  failed:  { bg: "rgba(255,77,77,0.1)",   color: "#ff4d4d", border: "rgba(255,77,77,0.3)"   },
};

const KES = (n) => `KES ${Number(n || 0).toLocaleString()}`;

const getCategoryEmoji = (cat) => ({
  Seeds: "🌱", Fertilizer: "🧪", Pesticides: "🛡️",
  Equipment: "⚙️", Produce: "🥬", Feeds: "📦"
}[cat] || "📦");

const getPayMethodLabel = (method) => ({
  stk:           "📱 M-Pesa STK Push",
  manual:        "🧾 Manual M-Pesa",
  pay_on_pickup: "💵 Pay on Pickup",
}[method] || method || "—");

const getCurrentUser = () => {
  try {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return null; }
};

const STAFF_ROLES    = ["admin", "stock_manager", "orders_manager", "sales_agent"];
const CUSTOMER_ROLES = ["customer", "farmer", "buyer", "supplier", "expert"];

export default function Orders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [search, setSearch]       = useState("");
  const [expanded, setExpanded]   = useState(null);
  const [error, setError]         = useState("");
  const [receiptStatus, setReceiptStatus] = useState({});

  const currentUser = getCurrentUser();
  const role        = currentUser?.role || "customer";
  const isStaff     = STAFF_ROLES.includes(role);
  const isCustomer  = CUSTOMER_ROLES.includes(role);

  useEffect(() => {
    API.get("/api/orders")
      .then(r => {
        let data = Array.isArray(r.data) ? r.data : [];
        if (isCustomer) {
          data = data.filter(o =>
            String(o.userId) === String(currentUser?.id) ||
            String(o.delivery?.email) === String(currentUser?.email) ||
            String(o.delivery?.phone) === String(currentUser?.phone)
          );
        }
        setOrders(data);
      })
      .catch(() => setError("Failed to load orders. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [isCustomer, currentUser?.id, currentUser?.email, currentUser?.phone]);

  const filtered = orders.filter(o => {
    const matchStatus  = filter === "all" || o.status === filter;
    const matchPayment = payFilter === "all" || (o.payment?.status || "pending") === payFilter;
    const matchSearch  = !search ||
      String(o._id).toLowerCase().includes(search.toLowerCase()) ||
      (o.delivery?.name || o.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.payment?.mpesaCode || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPayment && matchSearch;
  });

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status || "pending"] = (acc[o.status || "pending"] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = orders
    .filter(o => o.payment?.status === "paid")
    .reduce((s, o) => s + (o.total || o.totalAmount || 0), 0);

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const paidCount    = orders.filter(o => o.payment?.status === "paid").length;

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}`, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch { alert("Failed to update order status"); }
  };

  const updatePayment = async (id, paymentStatus) => {
    try {
      await API.put(`/orders/${id}`, { "payment.status": paymentStatus });
      setOrders(prev => prev.map(o =>
        o._id === id ? { ...o, payment: { ...o.payment, status: paymentStatus } } : o
      ));
      if (paymentStatus === "paid") {
        setReceiptStatus(prev => ({ ...prev, [id]: "auto-sent" }));
        setTimeout(() => setReceiptStatus(prev => ({ ...prev, [id]: null })), 4000);
      }
    } catch { alert("Failed to update payment status"); }
  };

  const sendReceipt = async (id) => {
    setReceiptStatus(prev => ({ ...prev, [id]: "sending" }));
    try {
      await API.post(`/orders/${id}/send-receipt`);
      setReceiptStatus(prev => ({ ...prev, [id]: "sent" }));
      setTimeout(() => setReceiptStatus(prev => ({ ...prev, [id]: null })), 4000);
    } catch {
      setReceiptStatus(prev => ({ ...prev, [id]: "error" }));
      setTimeout(() => setReceiptStatus(prev => ({ ...prev, [id]: null })), 4000);
    }
  };

  const toggleExpand = (id) => setExpanded(expanded === id ? null : id);

  if (loading) return (
    <div className="orders-loading">
      <div className="orders-spinner" />
      <p>Loading {isCustomer ? "your receipts" : "orders"}…</p>
    </div>
  );

  return (
    <div className="orders-page">

      {/* ── HEADER ── */}
      <div className="orders-header">
        <div>
          <h1 className="orders-title">
            {isCustomer ? "🧾 My Receipts" : "🛒 Orders"}
          </h1>
          <p className="orders-sub">
            {isCustomer
              ? "Your order history and payment receipts"
              : "Manage and track all customer orders"}
          </p>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="orders-stats">
        <div className="orders-stat-card">
          <span className="orders-stat-icon">📦</span>
          <div>
            <div className="orders-stat-val">{orders.length}</div>
            <div className="orders-stat-lbl">{isCustomer ? "My Orders" : "Total Orders"}</div>
          </div>
        </div>
        <div className="orders-stat-card">
          <span className="orders-stat-icon">⏳</span>
          <div>
            <div className="orders-stat-val">{pendingCount}</div>
            <div className="orders-stat-lbl">Pending</div>
          </div>
        </div>
        <div className="orders-stat-card">
          <span className="orders-stat-icon">✅</span>
          <div>
            <div className="orders-stat-val">{paidCount}</div>
            <div className="orders-stat-lbl">Paid</div>
          </div>
        </div>
        <div className="orders-stat-card">
          <span className="orders-stat-icon">💰</span>
          <div>
            <div className="orders-stat-val orders-stat-val--green">{KES(totalRevenue)}</div>
            <div className="orders-stat-lbl">{isCustomer ? "Total Spent" : "Total Revenue"}</div>
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="orders-filters">
        <div className="orders-filter-group">
          <span className="orders-filter-label">Order Status:</span>
          <div className="orders-pills">
            {["all", "pending", "processing", "completed", "cancelled"].map(s => (
              <button key={s}
                className={`orders-pill ${filter === s ? "orders-pill--active" : ""}`}
                onClick={() => setFilter(s)}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="orders-pill-count">
                  {s === "all" ? orders.length : (statusCounts[s] || 0)}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="orders-filter-group">
          <span className="orders-filter-label">Payment:</span>
          <div className="orders-pills">
            {["all", "paid", "pending", "failed"].map(s => (
              <button key={s}
                className={`orders-pill ${payFilter === s ? "orders-pill--active" : ""}`}
                onClick={() => setPayFilter(s)}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="orders-search-wrap">
        <span className="orders-search-icon">🔍</span>
        <input className="orders-search"
          placeholder={isCustomer
            ? "Search by order ID or M-Pesa code…"
            : "Search by order ID, customer name or M-Pesa code…"}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="orders-error">{error}</div>}

      {/* ── EMPTY STATE ── */}
      {filtered.length === 0 && !loading && (
        <div className="orders-empty">
          <div className="orders-empty-icon">🌾</div>
          <h3>{isCustomer ? "No orders yet" : "No orders found"}</h3>
          <p>{isCustomer
            ? "Your orders will appear here after you shop"
            : "When customers place orders they will appear here"}</p>
        </div>
      )}

      {/* ── ORDERS LIST ── */}
      <div className="orders-list">
        {filtered.map((o, i) => {
          const sc            = STATUS_COLOR[o.status] || STATUS_COLOR.pending;
          const pc            = PAYMENT_COLOR[o.payment?.status || "pending"];
          const isExpanded    = expanded === o._id;
          const customerName  = o.delivery?.name || o.customerName || "Unknown";
          const customerPhone = o.delivery?.phone || o.payment?.phone || "—";
          const customerEmail = o.delivery?.email || "—";
          const mpesaCode     = o.payment?.mpesaCode || o.mpesaCode || null;
          const isPickup      = o.deliveryMethod === "pickup";
          const isPayOnPickup = o.payment?.method === "pay_on_pickup";
          const rs            = receiptStatus[o._id];

          return (
            <div key={o._id}
              className={`orders-card ${isExpanded ? "orders-card--expanded" : ""}`}
              style={{ animationDelay: `${i * 0.04}s` }}>

              {/* CARD HEADER */}
              <div className="orders-card-header" onClick={() => toggleExpand(o._id)}>
                <div className="orders-card-left">
                  <span className="orders-order-id">#{String(o._id).slice(-8).toUpperCase()}</span>
                  <div className="orders-customer">
                    <span className="orders-customer-name">
                      {isCustomer ? "Order placed" : customerName}
                    </span>
                    <span className="orders-customer-phone">
                      {isCustomer
                        ? new Date(o.createdAt).toLocaleDateString("en-KE")
                        : customerPhone}
                    </span>
                  </div>
                </div>

                <div className="orders-card-right">
                  <span className="orders-total">{KES(o.total || o.totalAmount)}</span>

                  <span className="orders-status-pill" style={{
                    background: isPickup ? "rgba(99,102,241,0.1)" : "rgba(0,212,255,0.1)",
                    color:      isPickup ? "#818cf8" : "#00d4ff",
                    border:    `1px solid ${isPickup ? "rgba(99,102,241,0.3)" : "rgba(0,212,255,0.3)"}`,
                  }}>
                    {isPickup ? "🏪 Pickup" : "🚚 Delivery"}
                  </span>

                  <span className="orders-status-pill"
                    style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    {o.status || "pending"}
                  </span>

                  <span className="orders-status-pill"
                    style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                    {o.payment?.status === "paid"   ? "✅ Paid"
                      : o.payment?.status === "failed" ? "❌ Failed"
                      : isPayOnPickup                  ? "💵 Pay at Store"
                      : "⏳ Unpaid"}
                  </span>

                  <span className="orders-date">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-KE") : "—"}
                  </span>
                  <span className="orders-expand-icon">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* EXPANDED */}
              {isExpanded && (
                <div className="orders-card-body">
                  <div className="orders-detail-grid">

                    {/* Items */}
                    <div className="orders-detail-section">
                      <h4>🛍️ Items ({(o.items || []).length})</h4>
                      {(o.items || []).map((item, idx) => (
                        <div key={idx} className="orders-item-row">
                          <span>{getCategoryEmoji(item.category)} {item.name || item.product?.name || "Product"}</span>
                          <span>× {item.quantity || item.qty || 1}</span>
                          <span className="orders-item-price">{KES(item.price)}</span>
                        </div>
                      ))}
                      <div className="orders-item-total">
                        Total: <strong>{KES(o.total || o.totalAmount)}</strong>
                      </div>
                    </div>

                    {/* Delivery */}
                    <div className="orders-detail-section">
                      <h4>{isPickup ? "🏪 Pickup Info" : "📍 Delivery Info"}</h4>
                      <div className="orders-detail-row"><span>Name</span><span>{o.delivery?.name || "—"}</span></div>
                      <div className="orders-detail-row"><span>Phone</span><span>{o.delivery?.phone || "—"}</span></div>
                      <div className="orders-detail-row"><span>Email</span><span>{customerEmail}</span></div>
                      {!isPickup && <>
                        <div className="orders-detail-row"><span>County</span><span>{o.delivery?.county || "—"}</span></div>
                        <div className="orders-detail-row"><span>Address</span><span>{o.delivery?.address || "—"}</span></div>
                        {o.delivery?.notes && <div className="orders-detail-row"><span>Notes</span><span>{o.delivery.notes}</span></div>}
                      </>}
                      {isPickup && <div className="orders-detail-row"><span>Location</span><span>AgriGo Store, Juja</span></div>}
                    </div>

                    {/* Payment */}
                    <div className="orders-detail-section">
                      <h4>💳 Payment Info</h4>
                      <div className="orders-detail-row"><span>Method</span><span>{getPayMethodLabel(o.payment?.method)}</span></div>
                      {!isPayOnPickup && <div className="orders-detail-row"><span>M-Pesa Phone</span><span>{o.payment?.phone || "—"}</span></div>}
                      {mpesaCode && <div className="orders-detail-row"><span>M-Pesa Code</span><span className="orders-mpesa-code">{mpesaCode}</span></div>}
                      <div className="orders-detail-row"><span>Amount</span><span>{KES(o.payment?.amount || o.total)}</span></div>
                      <div className="orders-detail-row">
                        <span>Status</span>
                        <span style={{ color: pc.color, fontWeight: 600 }}>
                          {isPayOnPickup && o.payment?.status !== "paid"
                            ? "⏳ Awaiting payment at store"
                            : o.payment?.status || "pending"}
                        </span>
                      </div>
                    </div>

                    {/* Actions — staff only */}
                    {isStaff && (
                      <div className="orders-detail-section">
                        <h4>⚙️ Update Order</h4>
                        <div className="orders-action-group">
                          <label>Order Status</label>
                          <select className="orders-select"
                            value={o.status || "pending"}
                            onChange={e => updateStatus(o._id, e.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="orders-action-group">
                          <label>Payment Status</label>
                          <select className="orders-select"
                            value={o.payment?.status || "pending"}
                            onChange={e => updatePayment(o._id, e.target.value)}>
                            <option value="pending">Unpaid</option>
                            <option value="paid">Paid ✅</option>
                            <option value="failed">Failed ❌</option>
                          </select>
                        </div>
                        <div className="orders-action-group" style={{ marginTop: "12px" }}>
                          <label>Receipt</label>
                          <button className="orders-receipt-btn"
                            onClick={() => sendReceipt(o._id)}
                            disabled={rs === "sending"}>
                            {rs === "sending"   ? "⏳ Sending…"
                              : rs === "sent"     ? "✅ Receipt Sent!"
                              : rs === "auto-sent" ? "✅ Auto-sent on payment"
                              : rs === "error"    ? "❌ Failed — Retry"
                              : "📧 Send Receipt"}
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}