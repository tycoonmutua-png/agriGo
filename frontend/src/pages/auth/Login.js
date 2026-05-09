import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });

      // sessionStorage clears automatically when browser/tab is closed
      sessionStorage.setItem("token", res.data.token);

      navigate("/dashboard");
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

  return (
    <div className="auth-page">
      <div className="auth-bg-leaf auth-bg-leaf--1" aria-hidden="true" />
      <div className="auth-bg-leaf auth-bg-leaf--2" aria-hidden="true" />
      <div className="auth-bg-circle" aria-hidden="true" />

      <div className="auth-card">
        <div className="auth-logo-wrap">
          <div className="auth-logo-icon">🌾</div>
          <div>
            <h1 className="auth-brand">AgriGo</h1>
            <p className="auth-brand-sub"> The Smart Farming Platform</p>
          </div>
        </div>

        <h2 className="auth-heading">Welcome back 👋</h2>
        <p className="auth-subheading">Sign in to manage your farm</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email / Phone
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉</span>
              <input
                id="email"
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
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div className="auth-forgot-row">
            <span className="auth-link" role="button" tabIndex={0}>
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            className={`auth-btn-primary ${loading ? "auth-btn-loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" aria-label="Signing in…" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">or continue with</span>
          <span className="auth-divider-line" />
        </div>

        <div className="auth-social-row">
          <button className="auth-social-btn" type="button">
            <span>G</span> Google
          </button>
          <button className="auth-social-btn" type="button">
            <span>f</span> Facebook
          </button>
        </div>

        <p className="auth-switch-text">
          New?{" "}
          <span
            className="auth-link"
            onClick={() => navigate("/register")}
            role="button"
            tabIndex={0}
          >
            Create account
          </span>
        </p>
      </div>
    </div>
  );
}