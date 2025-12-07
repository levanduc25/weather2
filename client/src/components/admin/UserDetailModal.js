import React, { useState } from 'react';
import api from '../../services/api';

export default function UserDetailModal({ user, onClose, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: user.fullName || '', email: user.email || '', isVerified: user.isVerified || false });

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${user._id}`, form);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Failed to update user', err);
      alert('Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 6, width: 720, maxHeight: '80vh', overflow: 'auto' }}>
        <h3>User details</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div>Username: {user.username}</div>
            <div>Full name: <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
            <div>Email: <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div>Verified: <input type="checkbox" checked={form.isVerified} onChange={e => setForm({ ...form, isVerified: e.target.checked })} /></div>
          </div>
          <div style={{ width: 260 }}>
            <div>Favorites:</div>
            <ul>
              {(user.favoriteCities || []).map(f => <li key={`${f.lat}-${f.lon}`}>{f.name}, {f.country}</li>)}
            </ul>
            <div>Search history:</div>
            <ul>
              {(user.searchHistory || []).slice(0, 10).map(s => <li key={s.searchedAt}>{s.city}, {s.country} - {new Date(s.searchedAt).toLocaleString()}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={save} disabled={saving}>Save</button>
          <button onClick={onClose} style={{ marginLeft: 8 }}>Close</button>
        </div>
      </div>
    </div>
  );
}
