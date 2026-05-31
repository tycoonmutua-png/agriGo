import React, { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import "./StaffApproval.css";

const ROLE_LABELS = {
  cashier:          "Cashier",
  stock_supervisor: "Stock Supervisor",
  stock_manager:    "Stock Manager",
  orders_manager:   "Orders Manager",
  sales_agent:      "Sales Agent",
  admin:            "Administrator",
};

const ROLE_ICONS = {
  cashier:          "💵",
  stock_supervisor: "📦",
  stock_manager:    "📦",
  orders_manager:   "🗂️",
  sales_agent:      "📊",
  admin:            "🛡️",
};

const STATUS_STYLES = {
  pending:   { bg: "rgba(250,204,21,0.15)",  color: "#facc15", label: "Pending"   },
  active:    { bg: "rgba(74,222,128,0.15)",  color: "#4ade80", label: "Approved"  },
  rejected:  { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Rejected"  },
  suspended: { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Suspended" },
};

export default function StaffApproval() {
  const [staff,        setStaff]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [actionId,     setActionId]     = useState(null);
  const [filter,       setFilter]       = useState("pending");
  const [search,       setSearch]       = useState("");
  const [toast,        setToast]        = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm,      setAddForm]      = useState({ name: "", email: "", phone: "", role: "cashier", password: "" });
  const [addLoading,   setAddLoading]   = useState(false);
  const [addError,     setAddError]     = useState("");

  // ── Fetch staff ──
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/api/users/staff");
      setStaff(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load staff list.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Approve / Reject / Suspend ──
  const handleAction = async (id, status) => {
    setActionId(id);
    setConfirmModal(null);
    try {
      await API.patch(`/users/${id}/status`, { status });
      setStaff(prev => prev.map(s => s._id === id ? { ...s, status } : s));
      showToast(
        status === "active"     ? "✅ Staff member approved! They can now log in."
        : status === "rejected" ? "❌ Staff member rejected."
        : "⛔ Staff member suspended.",
        status === "active" ? "success" : "error"
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed.", "error");
    } finally {
      setActionId(null);
    }
  };

  // ── Add new staff ──
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      await API.post("/api/auth/register-staff", addForm);
      setShowAddModal(false);
      setAddForm({ name: "", email: "", phone: "", role: "cashier", password: "" });
      showToast("✅ Staff account created successfully!");
      fetchStaff();
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to create staff account.");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Counts ──
  const counts = {
    all:      staff.length,
    pending:  staff.filter(s => s.status === "pending").length,
    active:   staff.filter(s => s.status === "active").length,
    rejected: staff.filter(s => s.status === "rejected" || s.status === "suspended").length,
  };

  // ── Filter + search ──
  const filtered = staff.filter(s => {
    const matchFilter =
      filter === "all" ||
      (filter === "active"   && s.status === "active") ||
      (filter === "pending"  && s.status === "pending") ||
      (filter === "rejected" && (s.status === "rejected" || s.status === "suspended"));
    const q = search.toLowerCase();
    const matchSearch =
      (s.name  || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.phone || "").includes(q);
    return matchFilter && matchSearch;
  });

  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", color: "inherit", boxSizing: "border-box",
  };

  return (
    <div className="sa-page">

      {/* Toast */}
      {toast && <div className={`sa-toast sa-toast--${toast.type}`}>{toast.message}</div>}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="sa-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-icon">
              {confirmModal.action === "active" ? "✅" : confirmModal.action === "suspended" ? "⛔" : "❌"}
            </div>
            <h3 className="sa-modal-title">
              {confirmModal.action === "active"    ? "Approve Staff?"
               : confirmModal.action === "suspended" ? "Suspend Staff?"
               : "Reject Application?"}
            </h3>
            <p className="sa-modal-body">
              {confirmModal.action === "active"
                ? `${confirmModal.name} will be able to log in immediately.`
                : confirmModal.action === "suspended"
                ? `${confirmModal.name} will be suspended and cannot log in.`
                : `${confirmModal.name} will not be able to log in.`}
            </p>
            <div className="sa-modal-actions">
              <button className="sa-btn-ghost" onClick={() => setConfirmModal(null)}>Cancel</button>
              <button
                className={`sa-btn-confirm ${confirmModal.action === "active" ? "sa-btn-confirm--green" : "sa-btn-confirm--red"}`}
                onClick={() => handleAction(confirmModal.id, confirmModal.action)}>
                {confirmModal.action === "active"    ? "Yes, Approve"
                 : confirmModal.action === "suspended" ? "Yes, Suspend"
                 : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="sa-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="sa-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <h3 className="sa-modal-title">➕ Add Staff Member</h3>
            {addError && (
              <div style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", borderRadius: 8, padding: "10px 14px", color: "#ff4d4d", fontSize: "0.85rem", marginBottom: 16 }}>
                {addError}
              </div>
            )}
            <form onSubmit={handleAddStaff} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.82rem", opacity: 0.7, display: "block", marginBottom: 6 }}>Full Name *</label>
                <input type="text" placeholder="John Mwangi" required style={inputStyle}
                  value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", opacity: 0.7, display: "block", marginBottom: 6 }}>Email *</label>
                <input type="email" placeholder="staff@agrigo.com" required style={inputStyle}
                  value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", opacity: 0.7, display: "block", marginBottom: 6 }}>Phone</label>
                <input type="tel" placeholder="+254 700 000 000" style={inputStyle}
                  value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", opacity: 0.7, display: "block", marginBottom: 6 }}>Role *</label>
                <select style={{ ...inputStyle, background: "#0d2b1a" }}
                  value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}>
                  <option value="cashier">💵 Cashier</option>
                  <option value="stock_supervisor">📦 Stock Supervisor</option>
                  <option value="orders_manager">🗂️ Orders Manager</option>
                  <option value="sales_agent">📊 Sales Agent</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", opacity: 0.7, display: "block", marginBottom: 6 }}>
                  Password * <span style={{ opacity: 0.5 }}>(they can change it later)</span>
                </label>
                <input type="password" placeholder="Min. 8 characters" required minLength={8} style={inputStyle}
                  value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} />
              </div>
              <div className="sa-modal-actions">
                <button type="button" className="sa-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="sa-btn-confirm sa-btn-confirm--green" disabled={addLoading}>
                  {addLoading ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sa-header">
        <div>
          <h1 className="sa-title">Staff Management</h1>
          <p className="sa-subtitle">Manage staff accounts and permissions</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="sa-refresh-btn" onClick={fetchStaff}>🔄 Refresh</button>
          <button className="sa-refresh-btn"
            style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", borderColor: "rgba(74,222,128,0.3)" }}
            onClick={() => setShowAddModal(true)}>
            ➕ Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="sa-stats-row">
        <div className="sa-stat-card"><span className="sa-stat-num">{counts.all}</span><span className="sa-stat-lbl">Total Staff</span></div>
        <div className="sa-stat-card sa-stat-card--yellow"><span className="sa-stat-num">{counts.pending}</span><span className="sa-stat-lbl">Pending</span></div>
        <div className="sa-stat-card sa-stat-card--green"><span className="sa-stat-num">{counts.active}</span><span className="sa-stat-lbl">Approved</span></div>
        <div className="sa-stat-card sa-stat-card--red"><span className="sa-stat-num">{counts.rejected}</span><span className="sa-stat-lbl">Rejected / Suspended</span></div>
      </div>

      {/* Toolbar */}
      <div className="sa-toolbar">
        <div className="sa-tabs">
          {[
            { key: "pending",  label: "⏳ Pending"  },
            { key: "active",   label: "✅ Approved" },
            { key: "rejected", label: "❌ Rejected" },
            { key: "all",      label: "All"         },
          ].map(({ key, label }) => (
            <button key={key} className={`sa-tab ${filter === key ? "sa-tab--active" : ""}`}
              onClick={() => setFilter(key)}>
              {label}
              {counts[key] > 0 && <span className="sa-tab-badge">{counts[key]}</span>}
            </button>
          ))}
        </div>
        <div className="sa-search-wrap">
          <span className="sa-search-icon">🔍</span>
          <input type="text" className="sa-search" placeholder="Search name or email…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="sa-search-clear" onClick={() => setSearch("")}>✕</button>}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="sa-loading"><span className="sa-spinner" /><p>Loading staff…</p></div>
      ) : filtered.length === 0 ? (
        <div className="sa-empty">
          <span style={{ fontSize: 48 }}>👥</span>
          <p>{filter === "pending" ? "No pending applications right now." : `No ${filter} staff found.`}</p>
          <button className="sa-btn-confirm sa-btn-confirm--green" style={{ marginTop: 16 }}
            onClick={() => setShowAddModal(true)}>
            ➕ Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="sa-cards">
          {filtered.map(s => {
            const st     = STATUS_STYLES[s.status] || STATUS_STYLES.pending;
            const isBusy = actionId === s._id;
            return (
              <div key={s._id} className="sa-card">
                <div className="sa-card-top">
                  <div className="sa-avatar">
                    {s.avatar
                      ? <img src={s.avatar} alt={s.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      : (s.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="sa-card-identity">
                    <div className="sa-name">{s.name}</div>
                    <div className="sa-dept">{s.email}</div>
                  </div>
                  <span className="sa-status-badge"
                    style={{ background: st.bg, color: st.color, marginLeft: "auto" }}>
                    {st.label}
                  </span>
                </div>

                <div className="sa-card-grid">
                  <div className="sa-card-item">
                    <span className="sa-card-lbl">Role</span>
                    <span className="sa-role-chip">
                      {ROLE_ICONS[s.role] || "👤"} {ROLE_LABELS[s.role] || s.role}
                    </span>
                  </div>
                  <div className="sa-card-item">
                    <span className="sa-card-lbl">Phone</span>
                    <span className="sa-card-val">{s.phone || "—"}</span>
                  </div>
                  <div className="sa-card-item">
                    <span className="sa-card-lbl">Joined</span>
                    <span className="sa-card-val">{fmt(s.createdAt)}</span>
                  </div>
                  <div className="sa-card-item">
                    <span className="sa-card-lbl">Status</span>
                    <span style={{ color: st.color, fontWeight: 600 }}>{st.label}</span>
                  </div>
                </div>

                {s.role !== "admin" && (
                  <div className="sa-card-actions">
                    {/* Approve button — shown for pending, rejected, suspended */}
                    {s.status !== "active" && (
                      <button className="sa-btn-approve" disabled={isBusy}
                        onClick={() => setConfirmModal({ id: s._id, name: s.name, action: "active" })}>
                        {isBusy ? "Processing…" : "✓ Approve"}
                      </button>
                    )}
                    {/* Suspend button — shown for active staff */}
                    {s.status === "active" && (
                      <button className="sa-btn-reject" disabled={isBusy}
                        onClick={() => setConfirmModal({ id: s._id, name: s.name, action: "suspended" })}>
                        {isBusy ? "Processing…" : "⛔ Suspend"}
                      </button>
                    )}
                    {/* Reject button — shown for pending only */}
                    {s.status === "pending" && (
                      <button className="sa-btn-reject" disabled={isBusy}
                        onClick={() => setConfirmModal({ id: s._id, name: s.name, action: "rejected" })}>
                        {isBusy ? "Processing…" : "✕ Reject"}
                      </button>
                    )}
                  </div>
                )}
                {s.role === "admin" && (
                  <p style={{ opacity: 0.4, fontSize: "0.8rem", textAlign: "center", padding: "8px 0 0" }}>Admin account</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}