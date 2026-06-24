// ============================================================
//  StatCard.js — single summary metric card
//  Props: label, value, color ('green'|'blue'|'red'|'amber'), onClick
// ============================================================
import React from 'react';
import './StatCard.css';

export default function StatCard({ label, value, color = 'blue', onClick }) {
  return (
    <div
      className={`stat-card stat-card--${color} ${onClick ? 'stat-card--clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-value">
        {value === null || value === undefined ? (
          <span className="stat-loading">—</span>
        ) : (
          value
        )}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
