import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import API from "../../services/api";
import "./auth.css";

const ROLES = [
  { id: "farmer",   label: "Farmer",   icon: "🌱" },
  { id: "buyer",    label: "Buyer",    icon: "🛒" },
  { id: "supplier", label: "Supplier", icon: "🚚" },
  { id: "expert",   label: "Expert",   icon: "🔬" },
];

const COUNTIES = [
  "Nairobi", "Nakuru", "Uasin Gishu", "Meru", "Kisumu",
  "Machakos", "Murang'a", "Nyeri", "Kiambu", "Trans Nzoia",
  "Bungoma", "Kakamega", "Nandi", "Laikipia", "Embu",
];

const FB_APP_ID = "1881183455914736";

const loadFacebookSDK = () => {
  if (document.getElementById("facebook-jssdk")) return;
  window.fbAsyncInit = function () {
    window.FB.init({ appId: FB_APP_ID, cookie: true, xfbml: true, version: "v19.0" });
  };
  const js = document.createElement("script");
  js.id = "facebook-jssdk";
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  document.body.appendChild(js);
};

export default function CustomerRegister() {
  const navigate = useNavigate();

  const [customerType, setCustomerType] = useState("farmer");
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [phone,        setPhone]        = useState("");
  const [county,       setCounty]       = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed,       setAgreed]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [googleLoading,setGoogleLoading]= useState(false);
  const [fbLoading,    setFbLoading]    = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => { loadFacebookSDK(); }, []);

  // ── Email/Password Register ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return setError("Please accept the Terms of Service to continue.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", {  // ✅ FIXED: was /auth/register/customer
        firstName,
        lastName,
        email,
        phone,
        county,
        password,
        customerType,
      });
      sessionStorage.setItem("token", data.token);
      navigate("/products");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google Signup ────────────────────────────────────────────
  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        const { data } = await API.post("/auth/google", {
          access_token: tokenResponse.access_token,
        });
        sessionStorage.setItem("token", data.token);
        navigate("/products");
      } catch (err) {
        setError(err.response?.data?.message || "Google signup failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google signup was cancelled or failed."),
  });

  // ── Facebook Signup ──────────────────────────────────────────
  const handleFacebookSignup = () => {
    setError("");
    if (!window.FB) {
      setError("Facebook is loading, please try again in a moment.");
      return;
    }
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          setFbLoading(true);
          API.post("/auth/facebook", {
            access_token: response.authResponse.accessToken,
            userID:       response.authResponse.userID,
          }).then(({ data }) => {
            sessionStorage.setItem("token", data.token);
            navigate("/products");
          }).catch(err => {
            setError(err.response?.data?.message || "Facebook signup failed. Please try again.");
          }).finally(() => setFbLoading(false));
        } else {
          setError("Facebook signup was cancelled.");
        }
      },
      { scope: "email,public_profile" }
    );
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-leaf auth-bg-leaf--1" aria-hidden="true" />
      <div className="auth-bg-leaf auth-bg-leaf--2" aria-hidden="true" />
      <div className="auth-bg-circle" aria-hidden="true" />

      <div className="auth-card auth-card--register">

        {/* Header */}
        <div className="auth-reg-header">
          <button type="button" className="auth-back-btn"
            onClick={() => navigate("/register")} aria-label="Back">←</button>
          <div>
            <h2 className="auth-heading" style={{ marginBottom: 0 }}>Customer Account</h2>
            <p className="auth-subheading" style={{ marginBottom: 0 }}>Instant access after registration</p>
          </div>
        </div>

        {/* Stats */}
        <div className="auth-stats-row">
          <div className="auth-stat"><span className="auth-stat-val">12k+</span><span className="auth-stat-lbl">Farmers</span></div>
          <div className="auth-stat"><span className="auth-stat-val">8 Counties</span><span className="auth-stat-lbl">Coverage</span></div>
          <div className="auth-stat"><span className="auth-stat-val">4.8 ★</span><span className="auth-stat-lbl">Rated</span></div>
        </div>

        {/* ── SOCIAL SIGNUP ── */}
        <div style={{ padding: "0 24px 4px" }}>
          <p style={{ textAlign: "center", fontSize: "0.82rem", opacity: 0.6, marginBottom: "12px" }}>
            Quick signup with
          </p>
          <div className="auth-social-row">
            {/* Google */}
            <button className="auth-social-btn" type="button"
              onClick={() => handleGoogleSignup()} disabled={googleLoading || fbLoading}>
              {googleLoading ? <span className="auth-spinner" /> : (
                <>
                  <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8, flexShrink: 0 }}>
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.7 37.5 46.5 31.5 46.5 24.5z"/>
                    <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6z"/>
                    <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.2 0-11.5-4.2-13.4-9.8l-7.8 6C6.7 42.6 14.7 48 24 48z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Facebook */}
            <button className="auth-social-btn" type="button"
              onClick={handleFacebookSignup} disabled={fbLoading || googleLoading}>
              {fbLoading ? <span className="auth-spinner" /> : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8, flexShrink: 0 }}>
                    <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </>
              )}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="auth-divider" style={{ padding: "0 24px" }}>
          <span className="auth-divider-line" />
          <span className="auth-divider-text">or fill in your details</span>
          <span className="auth-divider-line" />
        </div>

        {error && <div className="auth-error" style={{ margin: "0 24px 4px" }}>{error}</div>}

        {/* ── EMAIL/PASSWORD FORM ── */}
        <form onSubmit={handleSubmit} className="auth-form" style={{ padding: "0 24px 24px" }} noValidate>

          {/* Role selector */}
          <div className="auth-field">
            <label className="auth-label">I am a</label>
            <div className="auth-role-row">
              {ROLES.map((r) => (
                <button key={r.id} type="button"
                  className={`auth-role-chip ${customerType === r.id ? "auth-role-chip--active" : ""}`}
                  onClick={() => setCustomerType(r.id)}>
                  <span className="auth-role-icon">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="auth-row-2">
            <div className="auth-field">
              <label className="auth-label" htmlFor="c-fn">First name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input id="c-fn" type="text" className="auth-input" placeholder="John"
                  value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="c-ln">Last name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input id="c-ln" type="text" className="auth-input" placeholder="Mwangi"
                  value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="c-email">Email address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉</span>
              <input id="c-email" type="email" className="auth-input"
                placeholder="farmer@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
          </div>

          {/* Phone */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="c-phone">Phone number</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📞</span>
              <input id="c-phone" type="tel" className="auth-input"
                placeholder="+254 700 000 000" value={phone}
                onChange={e => setPhone(e.target.value)} required />
            </div>
          </div>

          {/* County */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="c-county">County / Region</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📍</span>
              <select id="c-county" className="auth-input auth-select"
                value={county} onChange={e => setCounty(e.target.value)} required>
                <option value="">Select your county</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="c-pw">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input id="c-pw" type={showPassword ? "text" : "password"}
                className="auth-input" placeholder="Min. 8 characters"
                value={password} onChange={e => setPassword(e.target.value)}
                required minLength={8} autoComplete="new-password" />
              <button type="button" className="auth-eye-btn"
                onClick={() => setShowPassword(v => !v)} aria-label="Toggle password">
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Terms */}
          <label className="auth-terms">
            <input type="checkbox" className="auth-checkbox"
              checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <span className="auth-terms-text">
              I agree to the <span className="auth-link">Terms of Service</span> and{" "}
              <span className="auth-link">Privacy Policy</span>
            </span>
          </label>

          <button type="submit"
            className={`auth-btn-primary ${loading ? "auth-btn-loading" : ""}`}
            disabled={loading || googleLoading || fbLoading}>
            {loading ? <span className="auth-spinner" aria-label="Creating account…" /> : "Create Account"}
          </button>
        </form>

        <p className="auth-switch-text" style={{ paddingBottom: 16 }}>
          Already have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/login")} role="button" tabIndex={0}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}