// ============================================================
//  Alerts.js — active problems from Zabbix, sorted by severity
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import './Alerts.css';

// Map severityLevel (0–5) to a CSS class name
const SEVERITY_CLASS = {
  0: 'sev-0',
  1: 'sev-1',
  2: 'sev-2',
  3: 'sev-3',
  4: 'sev-4',
  5: 'sev-5',
};

// Severity badge with coloured dot
function SeverityBadge({ level, label }) {
  return (
    <span className={`sev-badge ${SEVERITY_CLASS[level] ?? 'sev-0'}`}>
      <span className="sev-dot" />
      {label}
    </span>
  );
}

export default function Alerts() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('all');   // 'all' | '2' | '3' | '4' | '5'

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAlerts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => {
    const timer = setInterval(fetchAlerts, 15000);  // alerts refresh faster
    return () => clearInterval(timer);
  }, [fetchAlerts]);

  // Filter by minimum severity
  const filtered = filter === 'all'
    ? alerts
    : alerts.filter(a => a.severityLevel >= parseInt(filter));

  // Count by severity for filter buttons
  const counts = alerts.reduce((acc, a) => {
    acc[a.severityLevel] = (acc[a.severityLevel] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Alerts</h1>
            <p className="page-subtitle">
              {loading ? 'Loading...' : `${filtered.length} active problem${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="btn-refresh" onClick={fetchAlerts}>↻ Refresh</button>
        </div>
      </div>

      {/* Severity filter pills */}
      <div className="filter-bar">
        <button
          className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
        <button
          className={`filter-pill filter-pill--disaster ${filter === '5' ? 'active' : ''}`}
          onClick={() => setFilter('5')}
        >
          Disaster ({counts[5] || 0})
        </button>
        <button
          className={`filter-pill filter-pill--high ${filter === '4' ? 'active' : ''}`}
          onClick={() => setFilter('4')}
        >
          High ({counts[4] || 0})
        </button>
        <button
          className={`filter-pill filter-pill--average ${filter === '3' ? 'active' : ''}`}
          onClick={() => setFilter('3')}
        >
          Average+ ({counts[3] || 0})
        </button>
      </div>

      {error && (
        <div className="state-box error">
          <span className="state-icon">✕</span>
          <span>{error}</span>
        </div>
      )}

      {loading && !error && (
        <div className="state-box">
          <div className="spinner" />
          <span>Fetching alerts from Zabbix...</span>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="state-box">
          <span className="state-icon">✓</span>
          <span>No active alerts</span>
        </div>
      )}

      {/* Alert cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="alerts-list">
          {filtered.map(alert => (
            <div
              key={alert.id}
              className={`alert-row ${SEVERITY_CLASS[alert.severityLevel] ?? 'sev-0'}`}
            >
              <div className="alert-main">
                <div className="alert-name">{alert.name}</div>
                <div className="alert-host">on {alert.host}</div>
              </div>
              <div className="alert-meta">
                <SeverityBadge level={alert.severityLevel} label={alert.severity} />
                <span className="alert-time">{alert.time}</span>
                {alert.acknowledged && (
                  <span className="alert-ack">✓ Ack</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
