import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "./auth.css";

const STAFF_ROLES = [
  {
    id:    "stock_manager",
    label: "Stock Manager",
    icon:  "📦",
    desc:  "Add/edit/delete products, manage inventory",
  },
  {
    id:    "orders_manager",
    label: "Orders Manager",
    icon:  "📋",
    desc:  "View/update orders, mark as delivered",
  },
  {
    id:    "sales_agent",
    label: "Sales Agent",
    icon:  "📊",
    desc:  "View sales reports, customer orders",
  },
];

const COUNTIES = [
  "Nairobi", "Nakuru", "Uasin Gishu", "Meru", "Kisumu",
  "Machakos", "Murang'a", "Nyeri", "Kiambu", "Trans Nzoia",
];

export default function StaffRegister() {
  const navigate = useNavigate();

  const [staffRole,     setStaffRole]     = useState("orders_manager");
  const [firstName,     setFirstName]     = useState("");
  const [lastName,      setLastName]      = useState("");
  const [email,         setEmail]         = useState("");
  const [phone,         setPhone]         = useState("");
  const [county,        setCounty]        = useState("");
  const [department,    setDepartment]    = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [agreed,        setAgreed]        = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [socialLoading, setSocialLoading] = useState(""); // "google" | "facebook"
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(null);

  // ── Email / password submit ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return setError("Please accept the Terms of Service to continue.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register/staff", {
        firstName, lastName, email, phone, county, department, password, staffRole,
      });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google sign-up ────────────────────────────────────────────
  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSocialLoading("google");
      setError("");
      try {
        const { data } = await axios.post("/api/auth/register/staff/google", {
          access_token: tokenResponse.access_token,
          staffRole,
          phone,
          county,
          department,
        });
        setSuccess(data);
      } catch (err) {
        setError(err.response?.data?.message || "Google sign-up failed. Try again.");
      } finally {
        setSocialLoading("");
      }
    },
    onError: () => setError("Google sign-up was cancelled or failed."),
  });

  // ── Facebook sign-up ──────────────────────────────────────────
  const handleFacebook = () => {
    if (!window.FB) return setError("Facebook SDK not loaded. Please refresh the page.");
    setError("");
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const { accessToken, userID } = response.authResponse;
          setSocialLoading("facebook");
          axios
            .post("/api/auth/register/staff/facebook", {
              access_token: accessToken,
              userID,
              staffRole,
              phone,
              county,
              department,
            })
            .then(({ data }) => setSuccess(data))
            .catch((err) =>
              setError(err.response?.data?.message || "Facebook sign-up failed. Try again.")
            )
            .finally(() => setSocialLoading(""));
        } else {
          setError("Facebook login was cancelled.");
        }
      },
      { scope: "email,public_profile" }
    );
  };

  // ── Pending / Success screen ──────────────────────────────────
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-bg-leaf auth-bg-leaf--1" aria-hidden="true" />
        <div className="auth-bg-circle" aria-hidden="true" />

        <div className="auth-card" style={{ maxWidth: 460, textAlign: "center" }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>⏳</div>
          <h2 className="auth-heading">Application Submitted!</h2>
          <p className="auth-subheading" style={{ marginBottom: 24 }}>
            Your staff account is{" "}
            <strong style={{ color: "#facc15" }}>pending admin approval</strong>. You'll be
            notified by email once reviewed.
          </p>

          <div className="auth-pending-info">
            <div><span>Name</span><strong>{success.user?.name}</strong></div>
            <div><span>Email</span><strong>{success.user?.email}</strong></div>
            <div>
              <span>Role</span>
              <strong style={{ textTransform: "capitalize" }}>
                {success.user?.role?.replace(/_/g, " ")}
              </strong>
            </div>
            <div><span>Staff ID</span><strong>{success.user?.staffId}</strong></div>
            <div>
              <span>Status</span>
              <strong style={{ color: "#facc15" }}>🕐 Pending Review</strong>
            </div>
          </div>

          <div className="auth-notice" style={{ marginTop: 20, textAlign: "left" }}>
            💡 Keep your Staff ID safe — you may need it when contacting the admin.
          </div>

          <button
            className="auth-btn-primary"
            style={{ marginTop: 24 }}
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────
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
            onClick={() => navigate("/register")}
            aria-label="Back"
          >
            ←
          </button>
          <div>
            <h2 className="auth-heading" style={{ marginBottom: 0 }}>Staff Application</h2>
            <p className="auth-subheading" style={{ marginBottom: 0 }}>
              Requires admin approval before access
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="auth-notice">
          🔐 Staff accounts are reviewed by an admin before activation. You will not be able
          to log in until your account is approved.
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>

          {/* ── Role selector ── */}
          <div className="auth-field">
            <label className="auth-label">Applying for role</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STAFF_ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`auth-register-choice ${
                    staffRole === r.id ? "auth-register-choice--active" : ""
                  }`}
                  onClick={() => setStaffRole(r.id)}
                  style={{ padding: "12px 14px" }}
                >
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div className="auth-register-choice-title">{r.label}</div>
                    <div className="auth-register-choice-sub">{r.desc}</div>
                  </div>
                  {staffRole === r.id && (
                    <span style={{ color: "rgba(74,222,128,0.9)", fontSize: 18, flexShrink: 0 }}>
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Social buttons ── */}
          <div className="auth-field">
            <label className="auth-label">Quick sign-up with</label>
            <div className="auth-social-row">
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => handleGoogle()}
                disabled={!!socialLoading || loading}
              >
                {socialLoading === "google" ? (
                  <span className="auth-spinner-sm" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="auth-social-btn auth-social-btn--fb"
                onClick={handleFacebook}
                disabled={!!socialLoading || loading}
              >
                {socialLoading === "facebook" ? (
                  <span className="auth-spinner-sm" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
                <span>Continue with Facebook</span>
              </button>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="auth-divider">
            <span>or fill in the form below</span>
          </div>

          {/* ── Name ── */}
          <div className="auth-row-2">
            <div className="auth-field">
              <label className="auth-label" htmlFor="s-fn">First name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input id="s-fn" type="text" className="auth-input" placeholder="Jane"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="s-ln">Last name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input id="s-ln" type="text" className="auth-input" placeholder="Wanjiku"
                  value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* ── Email ── */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="s-email">Work Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉</span>
              <input id="s-email" type="email" className="auth-input" placeholder="jane@agrigo.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
          </div>

          {/* ── Phone ── */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="s-phone">Phone number</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📞</span>
              <input id="s-phone" type="tel" className="auth-input" placeholder="+254 700 000 000"
                value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>

          {/* ── County + Department ── */}
          <div className="auth-row-2">
            <div className="auth-field">
              <label className="auth-label" htmlFor="s-county">County</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">📍</span>
                <select id="s-county" className="auth-input auth-select"
                  value={county} onChange={(e) => setCounty(e.target.value)} required>
                  <option value="">Select county</option>
                  {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="s-dept">Department</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🏢</span>
                <input id="s-dept" type="text" className="auth-input" placeholder="e.g. Logistics"
                  value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Password ── */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="s-pw">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input id="s-pw" type={showPassword ? "text" : "password"} className="auth-input"
                placeholder="Min. 8 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={8}
                autoComplete="new-password" />
              <button type="button" className="auth-eye-btn"
                onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password">
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* ── Terms ── */}
          <label className="auth-terms">
            <input type="checkbox" className="auth-checkbox" checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)} />
            <span className="auth-terms-text">
              I agree to the <span className="auth-link">Terms of Service</span> and{" "}
              <span className="auth-link">Privacy Policy</span>
            </span>
          </label>

          <button type="submit"
            className={`auth-btn-primary ${loading ? "auth-btn-loading" : ""}`}
            disabled={loading || !!socialLoading}>
            {loading ? <span className="auth-spinner" aria-label="Submitting…" /> : "Submit Application"}
          </button>
        </form>

        <p className="auth-switch-text">
          Already have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/login")} role="button" tabIndex={0}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}