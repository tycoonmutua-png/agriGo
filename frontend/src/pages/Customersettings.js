import React, { useState } from "react";
import API from "../services/api";

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid #1a3a1c", background: "rgba(255,255,255,0.04)",
  color: "#e8f5e9", fontSize: "0.9rem", outline: "none",
  transition: "border-color 0.2s", boxSizing: "border-box",
};

const labelStyle = {
  display: "block", fontSize: "0.8rem", color: "#8aab8c",
  marginBottom: 6, fontWeight: 500,
};

const cardStyle = {
  background: "#0c1a0d", borderRadius: 16, border: "1px solid #1a3a1c",
  padding: "24px 28px", marginBottom: 20,
};

export default function CustomerSettings() {
  const [toast,     setToast]     = useState(null);
  const [pwSaving,  setPwSaving]  = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Notification preferences (UI only for now)
  const [emailNotif,  setEmailNotif]  = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) return showToast("❌ Passwords do not match.", "error");
    if (newPw.length < 8)    return showToast("❌ Password must be at least 8 characters.", "error");
    setPwSaving(true);
    try {
      await API.patch("/users/me/password", { currentPassword: currentPw, newPassword: newPw });
      showToast("✅ Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password.", "error");
    } finally {
      setPwSaving(false);
    }
  };

  const Toggle = ({ value, onChange }) => (
    <button type="button" onClick={() => onChange(!value)} style={{
      width: 44, height: 24, borderRadius: 12,
      background: value ? "rgba(61,220,110,0.4)" : "rgba(255,255,255,0.1)",
      border: `1px solid ${value ? "rgba(61,220,110,0.6)" : "#1a3a1c"}`,
      position: "relative", cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 2,
        left: value ? 22 : 2,
        width: 18, height: 18, borderRadius: "50%",
        background: value ? "#3ddc6e" : "#8aab8c",
        transition: "left 0.2s",
      }} />
    </button>
  );

  return (
    <div style={{ padding: "32px 28px", maxWidth: 680, margin: "0 auto" }}>

      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: toast.type === "error" ? "rgba(255,77,77,0.15)" : "rgba(61,220,110,0.15)",
          border: `1px solid ${toast.type === "error" ? "rgba(255,77,77,0.4)" : "rgba(61,220,110,0.4)"}`,
          color: toast.type === "error" ? "#ff4d4d" : "#3ddc6e",
          padding: "12px 20px", borderRadius: 10, fontWeight: 500, fontSize: "0.9rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#e8f5e9", marginBottom: 4 }}>
          ⚙️ Settings
        </h1>
        <p style={{ color: "#8aab8c", fontSize: "0.9rem" }}>
          Manage your password and notification preferences
        </p>
      </div>

      {/* Change Password */}
      <div style={cardStyle}>
        <h3 style={{ color: "#e8f5e9", fontWeight: 600, marginBottom: 4 }}>🔒 Change Password</h3>
        <p style={{ color: "#8aab8c", fontSize: "0.82rem", marginBottom: 20 }}>
          Keep your account secure with a strong password.
        </p>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input type="password" style={inputStyle} value={currentPw}
              onChange={e => setCurrentPw(e.target.value)} required placeholder="••••••••" />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" style={inputStyle} value={newPw}
              onChange={e => setNewPw(e.target.value)} required placeholder="Min. 8 characters" minLength={8} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" style={inputStyle} value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)} required placeholder="Re-enter new password" />
          </div>
          <button type="submit" disabled={pwSaving} style={{
            marginTop: 4, padding: "11px 28px", borderRadius: 10,
            background: pwSaving ? "rgba(61,220,110,0.1)" : "rgba(61,220,110,0.2)",
            color: "#3ddc6e", fontWeight: 700, fontSize: "0.9rem",
            cursor: pwSaving ? "not-allowed" : "pointer",
            border: "1px solid rgba(61,220,110,0.35)", alignSelf: "flex-start",
          }}>
            {pwSaving ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div style={cardStyle}>
        <h3 style={{ color: "#e8f5e9", fontWeight: 600, marginBottom: 4 }}>🔔 Notifications</h3>
        <p style={{ color: "#8aab8c", fontSize: "0.82rem", marginBottom: 20 }}>
          Choose what updates you want to receive.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Email Notifications", sub: "Receive updates via email", value: emailNotif, set: setEmailNotif },
            { label: "Order Alerts",        sub: "Get notified on order status changes", value: orderAlerts, set: setOrderAlerts },
            { label: "Promotions & Offers", sub: "Receive deals and discount notifications", value: promoAlerts, set: setPromoAlerts },
          ].map(({ label, sub, value, set }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 10, border: "1px solid #1a3a1c",
              background: "rgba(255,255,255,0.02)",
            }}>
              <div>
                <div style={{ color: "#e8f5e9", fontWeight: 600, fontSize: "0.9rem" }}>{label}</div>
                <div style={{ color: "#8aab8c", fontSize: "0.78rem", marginTop: 2 }}>{sub}</div>
              </div>
              <Toggle value={value} onChange={set} />
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ ...cardStyle, border: "1px solid rgba(255,77,77,0.2)" }}>
        <h3 style={{ color: "#ff4d4d", fontWeight: 600, marginBottom: 4 }}>⚠️ Danger Zone</h3>
        <p style={{ color: "#8aab8c", fontSize: "0.82rem", marginBottom: 16 }}>
          Permanently delete your account and all associated data.
        </p>
        <button style={{
          padding: "10px 24px", borderRadius: 10,
          background: "rgba(255,77,77,0.1)", color: "#ff4d4d",
          border: "1px solid rgba(255,77,77,0.3)", fontWeight: 600,
          fontSize: "0.88rem", cursor: "pointer",
        }}
          onClick={() => showToast("Please contact support to delete your account.", "error")}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}