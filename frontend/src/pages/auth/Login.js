import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import API from "../../services/api";
import "./auth.css";

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

const STAFF_ROLES = ["admin", "stock_manager", "stock_supervisor", "orders_manager", "sales_agent", "cashier"];

export default function Login() {
  const navigate = useNavigate();
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fbLoading,     setFbLoading]     = useState(false);
  const [error,         setError]         = useState("");

  useEffect(() => { loadFacebookSDK(); }, []);

  const redirectByRole = (role) => {
    if (STAFF_ROLES.includes(role)) {
      navigate("/dashboard");
    } else {
      navigate("/shop");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/api/auth/login", { email, password });
      sessionStorage.setItem("token", res.data.token);
      redirectByRole(res.data.role);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        const { data } = await API.post("/api/auth/google", {
          access_token: tokenResponse.access_token,
        });
        sessionStorage.setItem("token", data.token);
        redirectByRole(data.role);
      } catch (err) {
        setError(err.response?.data?.message || "Google login failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google login was cancelled or failed."),
  });

  const handleFacebook = () => {
    setError("");
    if (!window.FB) {
      setError("Facebook is loading, please try again in a moment.");
      return;
    }
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          setFbLoading(true);
          API.post("/api/auth/facebook", {
            access_token: response.authResponse.accessToken,
            userID:       response.authResponse.userID,
          }).then(({ data }) => {
            sessionStorage.setItem("token", data.token);
            redirectByRole(data.role);
          }).catch(err => {
            setError(err.response?.data?.message || "Facebook login failed. Please try again.");
          }).finally(() => setFbLoading(false));
        } else {
          setError("Facebook login was cancelled.");
        }
      },
      { scope: "email,public_profile" }
    );
  };

  return (
    <div className="auth-page auth-page--bg">
      {/* Full background — aerial green tractor field */}
      <div className="auth-full-bg" />
      <div className="auth-full-overlay" />

      <div className="auth-card auth-card--glass">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <img src="/logo.png" alt="AgriGo" className="auth-logo-img" />
          <div>
            <h1 className="auth-brand">AgriGo</h1>
            <p className="auth-brand-sub">The Smart Farming Platform</p>
          </div>
        </div>

        <h2 className="auth-heading">Welcome back 👋</h2>
        <p className="auth-subheading">Sign in to manage your farm</p>

        {error && <div className="auth-error">{error}</div>}

        {/* Social buttons */}
        <div className="auth-social-row" style={{ marginBottom: 16 }}>
          <button className="auth-social-btn" type="button"
            onClick={() => handleGoogle()} disabled={googleLoading || fbLoading || loading}>
            {googleLoading ? <span className="auth-spinner" /> : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8, flexShrink: 0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.7 37.5 46.5 31.5 46.5 24.5z"/>
                  <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6z"/>
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.2 0-11.5-4.2-13.4-9.8l-7.8 6C6.7 42.6 14.7 48 24 48z"/>
                </svg>
                Google
              </>
            )}
          </button>

          <button className="auth-social-btn" type="button"
            onClick={handleFacebook} disabled={fbLoading || googleLoading || loading}>
            {fbLoading ? <span className="auth-spinner" /> : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8, flexShrink: 0 }}>
                  <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
                Facebook
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">or sign in with email</span>
          <span className="auth-divider-line" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <input id="email" type="email" className="auth-input"
                placeholder="farmer@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input id="password" type={showPassword ? "text" : "password"}
                className="auth-input" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password" />
              <button type="button" className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password">
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="auth-forgot-row">
            <span className="auth-link" role="button" tabIndex={0}>Forgot password?</span>
          </div>

          <button type="submit"
            className={`auth-btn-primary ${loading ? "auth-btn-loading" : ""}`}
            disabled={loading || googleLoading || fbLoading}>
            {loading ? <span className="auth-spinner" /> : "Sign In"}
          </button>
        </form>

        <p className="auth-switch-text">
          New?{" "}
          <span className="auth-link" onClick={() => navigate("/register")}
            role="button" tabIndex={0}>
            Create account
          </span>
        </p>
      </div>
    </div>
  );
}