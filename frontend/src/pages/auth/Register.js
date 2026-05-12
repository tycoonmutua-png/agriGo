import React from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-bg-leaf auth-bg-leaf--1" aria-hidden="true" />
      <div className="auth-bg-leaf auth-bg-leaf--2" aria-hidden="true" />
      <div className="auth-bg-circle" aria-hidden="true" />

      <div className="auth-card" style={{ maxWidth: 480 }}>
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
              Join 12,000+ farmers on AgriGo
            </p>
          </div>
        </div>

        {/* Stats */}
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

        <p
          className="auth-label"
          style={{ textAlign: "center", marginBottom: 16, marginTop: 8 }}
        >
          I want to register as
        </p>

        {/* Customer Option */}
        <button
          className="auth-register-choice"
          onClick={() => navigate("/register/customer")}
        >
          <span className="auth-register-choice-icon">🛒</span>
          <div style={{ flex: 1 }}>
            <div className="auth-register-choice-title">Customer</div>
            <div className="auth-register-choice-sub">
              Farmer · Buyer · Supplier · Expert
            </div>
            <div className="auth-register-choice-badge auth-register-choice-badge--green">
              ✓ Instant Access
            </div>
          </div>
          <span className="auth-register-choice-arrow">→</span>
        </button>

        {/* Staff Option */}
        <button
          className="auth-register-choice"
          onClick={() => navigate("/register/staff")}
          style={{ marginTop: 12 }}
        >
          <span className="auth-register-choice-icon">🏢</span>
          <div style={{ flex: 1 }}>
            <div className="auth-register-choice-title">Staff / Employee</div>
            <div className="auth-register-choice-sub">
              Stock Manager · Orders Manager · Sales Agent
            </div>
            <div className="auth-register-choice-badge auth-register-choice-badge--yellow">
              ⏳ Requires Admin Approval
            </div>
          </div>
          <span className="auth-register-choice-arrow">→</span>
        </button>

        <p className="auth-switch-text" style={{ marginTop: 28 }}>
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