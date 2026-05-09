import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";

const ROLES = [
  { id: "farmer", label: "Farmer", icon: "🌱" },
  { id: "buyer", label: "Buyer", icon: "🛒" },
  { id: "supplier", label: "Supplier", icon: "🚚" },
  { id: "expert", label: "Expert", icon: "🔬" },
];

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("farmer");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Replace with your actual API call, e.g.:
      // await api.post("/auth/register", { firstName, lastName, phone, email, password, role, county });
      await new Promise((r) => setTimeout(r, 1200)); // remove this line
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-leaf auth-bg-leaf--1" aria-hidden="true" />
      <div className="auth-bg-leaf auth-bg-leaf--2" aria-hidden="true" />
      <div className="auth-bg-circle" aria-hidden="true" />

      <div className="auth-card auth-card--register">
        {/* Header */}
        <div className="auth-reg-header">
          <button
            type="button"
            className="auth-back-btn"
            onClick={() => navigate("/login")}
            aria-label="Back to login"
          >
            ←
          </button>
          <div>
            <h2 className="auth-heading" style={{ marginBottom: 0 }}>
              Create Account
            </h2>
            <p className="auth-subheading" style={{ marginBottom: 0 }}>
              Join 12,000+ farmers on Agrigo
            </p>
          </div>
        </div>

        {/* Stats banner */}
        <div className="auth-stats-row">
          <div className="auth-stat">
            <span className="auth-stat-val">12k+</span>
            <span className="auth-stat-lbl">Farmers</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-val">8 Counties</span>
            <span className="auth-stat-lbl">Coverage</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-val">4.8 ★</span>
            <span className="auth-stat-lbl">Rated</span>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Role selector */}
          <div className="auth-field">
            <label className="auth-label">I am a</label>
            <div className="auth-role-row">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`auth-role-chip ${role === r.id ? "auth-role-chip--active" : ""}`}
                  onClick={() => setRole(r.id)}
                >
                  <span className="auth-role-icon">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name row */}
          <div className="auth-row-2">
            <div className="auth-field">
              <label className="auth-label" htmlFor="firstName">
                First name
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input
                  id="firstName"
                  type="text"
                  className="auth-input"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="lastName">
                Last name
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input
                  id="lastName"
                  type="text"
                  className="auth-input"
                  placeholder="Mwangi"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">
              Email address
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉</span>
              <input
                id="reg-email"
                type="email"
                className="auth-input"
                placeholder="farmer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="phone">
              Phone number
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📞</span>
              <input
                id="phone"
                type="tel"
                className="auth-input"
                placeholder="+254 700 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="county">
              County / Region
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📍</span>
              <select
                id="county"
                className="auth-input auth-select"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                required
              >
                <option value="">Select your county</option>
                <option>Nairobi</option>
                <option>Nakuru</option>
                <option>Uasin Gishu</option>
                <option>Meru</option>
                <option>Kisumu</option>
                <option>Machakos</option>
                <option>Murang'a</option>
                <option>Nyeri</option>
                <option>Kiambu</option>
                <option>Trans Nzoia</option>
              </select>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">
              Password
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                id="reg-password"
                type="password"
                className="auth-input"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Terms */}
          <label className="auth-terms">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="auth-terms-text">
              I agree to the{" "}
              <span className="auth-link">Terms of Service</span> and{" "}
              <span className="auth-link">Privacy Policy</span>
            </span>
          </label>

          <button
            type="submit"
            className={`auth-btn-primary ${loading ? "auth-btn-loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" aria-label="Creating account…" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="auth-switch-text">
          Already have an account?{" "}
          <span
            className="auth-link"
            onClick={() => navigate("/login")}
            role="button"
            tabIndex={0}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}