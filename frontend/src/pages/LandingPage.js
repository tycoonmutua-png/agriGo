import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`landing-page ${loaded ? "landing-loaded" : ""}`}>
      {/* Full background image — collage farm photo */}
      <div className="landing-bg" />
      <div className="landing-overlay" />

      {/* Floating particles */}
      <div className="landing-particles" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <span key={i} className={`particle particle--${i + 1}`} />
        ))}
      </div>

      {/* Content */}
      <div className="landing-content">
        {/* Logo */}
        <div className="landing-logo-wrap">
          <img src="/logo.png" alt="AgriGo" className="landing-logo" />
        </div>

        {/* Badge */}
        <div className="landing-badge">
          <span className="landing-badge-dot" />
          Smart Farming Platform
        </div>

        {/* Headline */}
        <h1 className="landing-title">
          <span className="landing-title-line">Grow</span>
          <span className="landing-title-line landing-title-accent">Smarter.</span>
          <span className="landing-title-line">Farm Better.</span>
        </h1>

        <p className="landing-subtitle">
          Quality farm inputs, fresh produce &amp; expert tools — delivered right to your door.
        </p>

        {/* Stats row */}
        <div className="landing-stats">
          <div className="landing-stat">
            <span className="landing-stat-val">500+</span>
            <span className="landing-stat-lbl">Farmers</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <span className="landing-stat-val">1,200+</span>
            <span className="landing-stat-lbl">Products</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <span className="landing-stat-val">24/7</span>
            <span className="landing-stat-lbl">Support</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="landing-cta">
          <button className="landing-btn-primary" onClick={() => navigate("/login")}>
            <span>Get Started</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button className="landing-btn-secondary" onClick={() => navigate("/register")}>
            Create Account
          </button>
        </div>
      </div>

      {/* Bottom swipe hint */}
      <div className="landing-hint">
        <span>Tap to explore</span>
        <div className="landing-hint-bar" />
      </div>
    </div>
  );
}