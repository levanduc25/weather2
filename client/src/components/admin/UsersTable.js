import React from 'react';

export default function UsersTable({ users, loading, page, perPage, total, onPageChange, onView, onDelete, onBanUnban }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const handleDelete = (userId) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Delete this user?')) {
      onDelete(userId);
    }
  };

  return (
    <div>
      {loading ? <div>Loading users...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Last Active</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ borderTop: '1px solid var(--muted)' }}>
                <td><img src={u.avatar || '/default-avatar.png'} alt="avatar" style={{ width: 36, height: 36, borderRadius: 18 }} /></td>
                <td>{u.fullName || u.username}</td>
                <td>{u.email}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
                <td>{u.lastActive ? new Date(u.lastActive).toLocaleString() : '-'}</td>
                <td>{u.banned ? 'Banned' : 'Active'}</td>
                <td>
                  <button onClick={() => onView(u)}>View</button>
                  <button onClick={() => onBanUnban(u._id, u.banned ? 'unban' : 'ban')} style={{ marginLeft: 8 }}>{u.banned ? 'Unban' : 'Ban'}</button>
                  <button onClick={() => handleDelete(u._id)} style={{ marginLeft: 8 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 12 }}>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>Prev</button>
        <span style={{ margin: '0 8px' }}>Page {page} / {totalPages}</span>
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next</button>
      </div>
    </div>
  );
}
