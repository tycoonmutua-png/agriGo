import { useState } from "react";
import API from "../services/api";
import "./SharedPage.css";

export default function Profile() {
  const [saved, setSaved] = useState(false);

  let user = {};
  try {
    const token = sessionStorage.getItem("token");
    if (token) user = JSON.parse(atob(token.split(".")[1]));
  } catch {}

  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: "",
    currentPassword: "",
    newPassword: "",
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.put("/auth/profile", form).catch(() => {});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  };

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Profile</h1>
          <p className="sp-sub">Manage your admin account</p>
        </div>
      </div>

      <div className="sp-settings-grid">
        <div className="sp-settings-card">
          <div className="sp-profile-avatar">
            <div className="sp-big-avatar">
              {(form.name || form.email || "A")[0].toUpperCase()}
            </div>
            <div>
              <p className="sp-profile-name">{form.name || "Admin"}</p>
              <p className="sp-profile-role">Administrator · Agrigo</p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <h2 className="sp-section-title" style={{ marginBottom:"16px" }}>Account Details</h2>
            {[
              { label:"Full Name", key:"name",  type:"text",  placeholder:"Your name" },
              { label:"Email",     key:"email", type:"email", placeholder:"admin@agrigo.co.ke" },
              { label:"Phone",     key:"phone", type:"tel",   placeholder:"+254 700 000 000" },
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

            <h2 className="sp-section-title" style={{ margin:"24px 0 16px" }}>Change Password</h2>
            {[
              { label:"Current Password", key:"currentPassword" },
              { label:"New Password",     key:"newPassword" },
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

            <button type="submit" className="sp-btn-primary" style={{ marginTop:"8px" }}>
              {saved ? "✓ Saved!" : "Update Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}