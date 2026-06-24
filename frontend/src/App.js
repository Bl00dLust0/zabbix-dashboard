// ============================================================
//  App.js — root component, handles page navigation
//  No router library needed — we use simple state for now
// ============================================================
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Hosts from './pages/Hosts';
import Alerts from './pages/Alerts';
import './App.css';

export default function App() {
  // "page" state controls which page is shown
  // Possible values: 'dashboard', 'hosts', 'alerts'
  const [page, setPage] = useState('dashboard');

  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={setPage} />
      <main className="app-main">
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'hosts'     && <Hosts />}
        {page === 'alerts'    && <Alerts />}
      </main>
    </div>
  );
}
