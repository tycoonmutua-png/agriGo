import { useState } from "react";
import API from "../services/api";
import "./SharedPage.css";

const getUserFromToken = () => {
  try {
    const token = sessionStorage.getItem("token");
    if (!token) return {};
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return {}; }
};

const ROLE_LABELS = {
  admin:   { label: "Administrator", emoji: "🛡️", color: "#4ade80" },
  farmer:  { label: "Farmer",        emoji: "🌾", color: "#fbbf24" },
  user:    { label: "Customer",      emoji: "👤", color: "#818cf8" },
};

export default function Profile() {
  const user = getUserFromToken();
  const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.user;

  const [form, setForm] = useState({
    name:            user.name  || "",
    email:           user.email || "",
    phone:           user.phone || "",
    currentPassword: "",
    newPassword:     "",
  });
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await API.put("/auth/profile", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    }
  };

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Profile</h1>
          <p className="sp-sub">Manage your account details</p>
        </div>
      </div>

      <div className="sp-settings-grid">
        <div className="sp-settings-card">

          {/* Avatar + role badge */}
          <div className="sp-profile-avatar">
            <div className="sp-big-avatar">
              {(form.name || form.email || "U")[0].toUpperCase()}
            </div>
            <div>
              <p className="sp-profile-name">{form.name || "User"}</p>
              <p className="sp-profile-role" style={{ color: roleInfo.color }}>
                {roleInfo.emoji} {roleInfo.label} · AgriGo
              </p>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ff4d4d", fontSize: "0.85rem", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSave}>
            <h2 className="sp-section-title" style={{ marginBottom: "16px" }}>Account Details</h2>

            {[
              { label: "Full Name", key: "name",  type: "text",  placeholder: "Your name" },
              { label: "Email",     key: "email", type: "email", placeholder: "you@example.com" },
              { label: "Phone",     key: "phone", type: "tel",   placeholder: "+254 700 000 000" },
            ].map(f => (
              <div className="sp-field" key={f.key}>
                <label className="sp-label">{f.label}</label>
                <input
                  className="sp-input"
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}

            <h2 className="sp-section-title" style={{ margin: "24px 0 16px" }}>Change Password</h2>
            {[
              { label: "Current Password", key: "currentPassword" },
              { label: "New Password",     key: "newPassword" },
            ].map(f => (
              <div className="sp-field" key={f.key}>
                <label className="sp-label">{f.label}</label>
                <input
                  className="sp-input"
                  type="password"
                  placeholder="••••••••"
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}

            <button type="submit" className="sp-btn-primary" style={{ marginTop: "8px" }}>
              {saved ? "✓ Saved!" : "Update Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}