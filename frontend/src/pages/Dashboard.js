// ============================================================
//  Dashboard.js — summary page with 4 stat cards
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import StatCard from '../components/StatCard';
import './Dashboard.css';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  // fetchStats is wrapped in useCallback so we can call it
  // both on mount and when the user clicks Refresh
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on first load
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Live overview of your infrastructure</p>
          </div>
          <button className="btn-refresh" onClick={fetchStats}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="state-box error">
          <span className="state-icon">✕</span>
          <span>Could not reach backend: {error}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Make sure your Node.js server is running on port 5000
          </span>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="state-box">
          <div className="spinner" />
          <span>Connecting to Zabbix...</span>
        </div>
      )}

      {/* Stats grid */}
      {!loading && !error && stats && (
        <>
          <div className="stats-grid">
            <StatCard
              label="Total Hosts"
              value={stats.totalHosts}
              color="blue"
            />
            <StatCard
              label="Online"
              value={stats.onlineHosts}
              color="green"
              onClick={() => onNavigate('hosts')}
            />
            <StatCard
              label="Offline"
              value={stats.offlineHosts}
              color="red"
              onClick={() => onNavigate('hosts')}
            />
            <StatCard
              label="Active Alerts"
              value={stats.activeAlerts}
              color="amber"
              onClick={() => onNavigate('alerts')}
            />
          </div>

          {/* Quick status summary */}
          <div className="card status-summary">
            <div className="status-summary-title">Infrastructure health</div>
            <div className="health-bar-wrap">
              <div
                className="health-bar-fill"
                style={{
                  width: stats.totalHosts > 0
                    ? `${Math.round((stats.onlineHosts / stats.totalHosts) * 100)}%`
                    : '0%'
                }}
              />
            </div>
            <div className="health-bar-label">
              {stats.totalHosts > 0
                ? `${Math.round((stats.onlineHosts / stats.totalHosts) * 100)}% of hosts online`
                : 'No hosts found'}
            </div>

            <div className="quick-links">
              <button className="quick-link" onClick={() => onNavigate('hosts')}>
                View all hosts →
              </button>
              <button className="quick-link quick-link--amber" onClick={() => onNavigate('alerts')}>
                View active alerts →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
