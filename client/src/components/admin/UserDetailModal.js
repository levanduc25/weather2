import React, { useState } from 'react';
import api from '../../services/api';

export default function UserDetailModal({ user, onClose, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    isVerified: user.isVerified || false
  });

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
    <>
      <style>{`
        /* Overlay làm tối + blur */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        /* Modal box sáng rõ */
        .modal-box {
          background: #ffffff;
          padding: 20px;
          border-radius: 10px;
          width: 680px;
          max-height: 80vh;
          overflow-y: auto;
          animation: showUp .2s ease-out;
          box-shadow: 0 8px 20px rgba(0,0,0,0.25);
        }

        @keyframes showUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-title {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #222;
        }

        .field-label {
          margin-top: 10px;
          font-weight: 500;
          color: #333;
        }

        input[type="text"],
        input[type="email"] {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          margin-top: 4px;
          font-size: 15px;
        }

        .btn-save {
          background: #007bff;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
        }

        .btn-close {
          background: #ddd;
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          margin-left: 8px;
          cursor: pointer;
        }

        ul {
          padding-left: 18px;
        }
      `}</style>

      <div className="modal-overlay">
        <div className="modal-box">
          <h3 className="modal-title">User details</h3>

          <div style={{ display: 'flex', gap: 20 }}>
            {/* LEFT */}
            <div style={{ flex: 1 }}>
              <div className="field-label">Username:</div>
              <div>{user.username}</div>

              <div className="field-label">Full name:</div>
              <input
                type="text"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
              />

              <div className="field-label">Email:</div>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />

              <div className="field-label">
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={e => setForm({ ...form, isVerified: e.target.checked })}
                  />
                  Verified
                </label>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ width: 260 }}>
              <div className="field-label">Favorites:</div>
              <ul>
                {(user.favoriteCities || []).map(f => (
                  <li key={`${f.lat}-${f.lon}`}>{f.name}, {f.country}</li>
                ))}
              </ul>

              <div className="field-label">Search history:</div>
              <ul>
                {(user.searchHistory || []).slice(0, 10).map(s => (
                  <li key={s.searchedAt}>
                    {s.city}, {s.country} – {new Date(s.searchedAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn-save" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>

            <button className="btn-close" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
