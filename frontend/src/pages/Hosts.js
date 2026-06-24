// ============================================================
//  Hosts.js — table of all hosts with CPU, RAM, ping, status
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import './Hosts.css';

// Badge component for status/ping indicators
function Badge({ value }) {
  const map = {
    'Online':  { cls: 'badge--green',  label: 'Online'  },
    'Offline': { cls: 'badge--red',    label: 'Offline' },
    'Unknown': { cls: 'badge--gray',   label: 'Unknown' },
    'UP':      { cls: 'badge--green',  label: 'UP'      },
    'DOWN':    { cls: 'badge--red',    label: 'DOWN'    },
    'N/A':     { cls: 'badge--gray',   label: 'N/A'     },
  };
  const { cls, label } = map[value] || { cls: 'badge--gray', label: value };
  return <span className={`badge ${cls}`}>{label}</span>;
}

// Colour the CPU/RAM value based on threshold
function MetricCell({ value }) {
  if (value === 'N/A') return <span className="metric-na">N/A</span>;
  const num = parseFloat(value);
  let cls = 'metric-ok';
  if (num >= 80) cls = 'metric-crit';
  else if (num >= 60) cls = 'metric-warn';
  return <span className={cls}>{value}</span>;
}

export default function Hosts() {
  const [hosts, setHosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const fetchHosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hosts');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHosts(); }, [fetchHosts]);
  useEffect(() => {
    const timer = setInterval(fetchHosts, 30000);
    return () => clearInterval(timer);
  }, [fetchHosts]);

  // Toggle sort column
  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  // Filter by search, then sort
  const filtered = hosts
    .filter(h =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.ip.includes(search)
    )
    .sort((a, b) => {
      let av = a[sortKey] ?? '';
      let bv = b[sortKey] ?? '';
      // Numeric sort for CPU/memory
      if (sortKey === 'cpu' || sortKey === 'memory') {
        av = parseFloat(av) || 0;
        bv = parseFloat(bv) || 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ col }) => (
    <span className="sort-icon">
      {sortKey === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
    </span>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Hosts</h1>
            <p className="page-subtitle">
              {loading ? 'Loading...' : `${filtered.length} of ${hosts.length} hosts`}
            </p>
          </div>
          <button className="btn-refresh" onClick={fetchHosts}>↻ Refresh</button>
        </div>
      </div>

      {/* Search bar */}
      <div className="hosts-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search by name or IP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
          <span>Fetching hosts from Zabbix...</span>
        </div>
      )}

      {!loading && !error && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="hosts-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>Host <SortIcon col="name" /></th>
                <th onClick={() => handleSort('ip')}>IP Address <SortIcon col="ip" /></th>
                <th onClick={() => handleSort('status')}>Status <SortIcon col="status" /></th>
                <th onClick={() => handleSort('cpu')}>CPU <SortIcon col="cpu" /></th>
                <th onClick={() => handleSort('memory')}>Memory <SortIcon col="memory" /></th>
                <th onClick={() => handleSort('ping')}>Ping <SortIcon col="ping" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">No hosts match your search</td>
                </tr>
              ) : (
                filtered.map(host => (
                  <tr key={host.id}>
                    <td className="host-name">{host.name}</td>
                    <td className="host-ip">{host.ip}</td>
                    <td><Badge value={host.status} /></td>
                    <td><MetricCell value={host.cpu} /></td>
                    <td><MetricCell value={host.memory} /></td>
                    <td><Badge value={host.ping} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
