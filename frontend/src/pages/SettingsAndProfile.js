import React, { useState, useEffect } from "react";
import API from "../services/api";

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid #1a3a1c", background: "rgba(255,255,255,0.04)",
  color: "#e8f5e9", fontSize: "0.9rem", outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block", fontSize: "0.8rem", color: "#8aab8c",
  marginBottom: 6, fontWeight: 500,
};

const cardStyle = {
  background: "#0c1a0d", borderRadius: 16, border: "1px solid #1a3a1c",
  padding: "24px 28px", marginBottom: 20,
};

const COUNTIES = [
  "Nairobi","Nakuru","Uasin Gishu","Meru","Kisumu",
  "Machakos","Murang'a","Nyeri","Kiambu","Trans Nzoia",
  "Mombasa","Kisii","Kericho","Eldoret","Thika",
];

export default function SettingsAndProfile() {
  const [tab,       setTab]       = useState("profile");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [pwSaving,  setPwSaving]  = useState(false);
  const [toast,     setToast]     = useState(null);

  // Profile fields
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [county,  setCounty]  = useState("");

  // Password fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Fetch user from API on mount
  useEffect(() => {
    API.get("/users/me")
      .then(({ data }) => {
        setName(data.name   || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setCounty(data.county || "");
      })
      .catch(() => {
        // Fallback to sessionStorage
        const stored = JSON.parse(sessionStorage.getItem("user") || "{}");
        setName(stored.name   || "");
        setEmail(stored.email || "");
        setPhone(stored.phone || "");
        setCounty(stored.county || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.patch("/users/me", { name, phone, county });
      const stored = JSON.parse(sessionStorage.getItem("user") || "{}");
      sessionStorage.setItem("user", JSON.stringify({ ...stored, ...data }));
      showToast("✅ Profile updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
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

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "#8aab8c" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      <p>Loading your profile…</p>
    </div>
  );

  return (
    <div style={{ padding: "32px 28px", maxWidth: 680, margin: "0 auto" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: toast.type === "error" ? "rgba(255,77,77,0.15)" : "rgba(61,220,110,0.15)",
          border: `1px solid ${toast.type === "error" ? "rgba(255,77,77,0.4)" : "rgba(61,220,110,0.4)"}`,
          color: toast.type === "error" ? "#ff4d4d" : "#3ddc6e",
          padding: "12px 20px", borderRadius: 10, fontWeight: 500, fontSize: "0.9rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#e8f5e9", marginBottom: 4 }}>
          ⚙️ Settings & Profile
        </h1>
        <p style={{ color: "#8aab8c", fontSize: "0.9rem" }}>
          Manage your account information and preferences
        </p>
      </div>

      {/* Avatar banner */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(61,220,110,0.15)", border: "2px solid rgba(61,220,110,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 700, color: "#3ddc6e", flexShrink: 0,
        }}>
          {name ? name[0].toUpperCase() : "?"}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#e8f5e9" }}>{name || "—"}</div>
          <div style={{ color: "#8aab8c", fontSize: "0.85rem" }}>{email}</div>
          <div style={{
            display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 20,
            background: "rgba(61,220,110,0.1)", color: "#3ddc6e",
            fontSize: "0.75rem", fontWeight: 600,
          }}>
            Customer
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { key: "profile",  label: "👤 Profile"  },
          { key: "password", label: "🔒 Password" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "8px 20px", borderRadius: 10,
            cursor: "pointer", fontWeight: 600, fontSize: "0.88rem",
            transition: "all 0.2s",
            background:  tab === key ? "rgba(61,220,110,0.15)" : "transparent",
            color:       tab === key ? "#3ddc6e" : "#8aab8c",
            border:      `1px solid ${tab === key ? "rgba(61,220,110,0.35)" : "#1a3a1c"}`,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div style={cardStyle}>
          <h3 style={{ color: "#e8f5e9", fontWeight: 600, marginBottom: 20 }}>Personal Information</h3>
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)}
                placeholder="Jane Wanjiku" required />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} value={email} disabled />
              <p style={{ color: "#8aab8c", fontSize: "0.75rem", marginTop: 4 }}>Email cannot be changed here.</p>
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+254 700 000 000" />
            </div>
            <div>
              <label style={labelStyle}>County</label>
              <select style={{ ...inputStyle, background: "#0d2b1a" }}
                value={county} onChange={e => setCounty(e.target.value)}>
                <option value="">Select county</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} style={{
              marginTop: 4, padding: "11px 28px", borderRadius: 10,
              background: saving ? "rgba(61,220,110,0.1)" : "rgba(61,220,110,0.2)",
              color: "#3ddc6e", fontWeight: 700, fontSize: "0.9rem",
              cursor: saving ? "not-allowed" : "pointer",
              border: "1px solid rgba(61,220,110,0.35)",
              alignSelf: "flex-start",
            }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {tab === "password" && (
        <div style={cardStyle}>
          <h3 style={{ color: "#e8f5e9", fontWeight: 600, marginBottom: 20 }}>Change Password</h3>
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
              border: "1px solid rgba(61,220,110,0.35)",
              alignSelf: "flex-start",
            }}>
              {pwSaving ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}