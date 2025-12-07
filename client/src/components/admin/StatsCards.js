import React from 'react';

export default function StatsCards({ stats }) {
  return (
    <div className="stats-cards" style={{ display: 'flex', gap: 12 }}>
      <div className="card" style={{ padding: 12, border: '1px solid var(--muted)', borderRadius: 6 }}>
        <div className="label">Total users</div>
        <div className="value">{stats.usersCount}</div>
      </div>
      <div className="card" style={{ padding: 12, border: '1px solid var(--muted)', borderRadius: 6 }}>
        <div className="label">Active (7d)</div>
        <div className="value">{stats.active7d || 'N/A'}</div>
      </div>
      <div className="card" style={{ padding: 12, border: '1px solid var(--muted)', borderRadius: 6 }}>
        <div className="label">API calls (today)</div>
        <div className="value">{stats.eventsToday}</div>
      </div>
      <div className="card" style={{ padding: 12, border: '1px solid var(--muted)', borderRadius: 6 }}>
        <div className="label">Discord connections</div>
        <div className="value">{stats.discordConnections || 'N/A'}</div>
      </div>
    </div>
  );
}
