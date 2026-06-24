// ============================================================
//  Sidebar.js — left navigation panel
// ============================================================
import React from 'react';
import './Sidebar.css';

// Nav items — icon (emoji), label, page key
const NAV_ITEMS = [
  { icon: '▦',  label: 'Dashboard', page: 'dashboard' },
  { icon: '⬡',  label: 'Hosts',     page: 'hosts'     },
  { icon: '⚠',  label: 'Alerts',    page: 'alerts'    },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      {/* Logo / brand */}
      <div className="sidebar-brand">
        <span className="brand-dot" />
        <span className="brand-name">ZabbixView</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.page}
            className={`nav-item ${activePage === item.page ? 'active' : ''}`}
            onClick={() => onNavigate(item.page)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {activePage === item.page && <span className="nav-indicator" />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <span className="footer-dot online" />
        <span className="footer-text">Connected</span>
      </div>
    </aside>
  );
}
