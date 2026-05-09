import { useState } from "react";
import API from "../services/api";
import "./SharedPage.css";

export default function Settings() {
  const [saved, setSaved]   = useState(false);
  const [form, setForm]     = useState({
    storeName: "Agrigo Agrovet",
    email: "",
    phone: "",
    location: "Nairobi, Kenya",
    currency: "KES",
    lowStockAlert: "10",
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.put("/settings", form).catch(() => {});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Settings</h1>
          <p className="sp-sub">Configure your Agrigo store preferences</p>
        </div>
      </div>

      <div className="sp-settings-grid">
        <form onSubmit={handleSave} className="sp-settings-card">
          <h2 className="sp-section-title">Store Information</h2>

          {[
            { label:"Store Name",     key:"storeName", type:"text",  placeholder:"Your store name" },
            { label:"Contact Email",  key:"email",     type:"email", placeholder:"admin@agrigo.co.ke" },
            { label:"Phone Number",   key:"phone",     type:"tel",   placeholder:"+254 700 000 000" },
            { label:"Location",       key:"location",  type:"text",  placeholder:"City, Country" },
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

          <div className="sp-field">
            <label className="sp-label">Currency</label>
            <select className="sp-input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
              <option value="KES">KES — Kenyan Shilling</option>
              <option value="USD">USD — US Dollar</option>
              <option value="UGX">UGX — Ugandan Shilling</option>
              <option value="TZS">TZS — Tanzanian Shilling</option>
            </select>
          </div>

          <div className="sp-field">
            <label className="sp-label">Low Stock Alert Threshold (units)</label>
            <input
              className="sp-input"
              type="number"
              min="1"
              value={form.lowStockAlert}
              onChange={e => setForm({ ...form, lowStockAlert: e.target.value })}
            />
          </div>

          <button type="submit" className="sp-btn-primary">
            {saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </form>

        <div className="sp-settings-card">
          <h2 className="sp-section-title">Danger Zone</h2>
          <p className="sp-danger-desc">These actions are irreversible. Proceed with caution.</p>
          <button className="sp-btn-danger" onClick={() => {
            if (window.confirm("Clear all orders? This cannot be undone.")) {
              API.delete("/orders/all").catch(() => {});
            }
          }}>
            Clear All Orders
          </button>
        </div>
      </div>
    </div>
  );
}