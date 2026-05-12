import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "./DashboardLayout.css";

const NAV = [
  {
    path: "/shop",
    label: "Products",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    path: "/my-receipts",
    label: "My Receipts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    path: "/customer-settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
  {
    path: "/customer-profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function CustomerLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [pageKey, setPageKey]     = useState(location.pathname);
  const prevPath  = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      setPageKey(location.pathname);
    }
  }, [location.pathname]);

  const handleNav = (path) => {
    if (path === location.pathname) return;
    navigate(path);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className={`layout ${collapsed ? "layout--collapsed" : ""}`}>

      {/* SIDEBAR */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <img src="/logo.png" alt="AgriGo" className="sidebar-logo-img" />
          {!collapsed && <span className="sidebar-logo-text">AgriGo</span>}
        </div>

        {/* Collapse toggle */}
        <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {collapsed
              ? <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${isActive(item.path) ? "nav-item--active" : ""}`}
              onClick={() => handleNav(item.path)}
              title={collapsed ? item.label : ""}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
              {isActive(item.path) && <span className="nav-active-bar" />}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="sidebar-bottom">
          <button
            className="nav-item nav-item--logout"
            onClick={() => { sessionStorage.clear(); window.location.href = "/login"; }}
            title={collapsed ? "Logout" : ""}
          >
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            {!collapsed && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="layout-main">
        <div key={pageKey} className="page-transition">
          <Outlet />
        </div>
      </main>
    </div>
  );
}