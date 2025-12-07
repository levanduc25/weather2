import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import api from '../services/api';
import UsersTable from '../components/admin/UsersTable';
import UserDetailModal from '../components/admin/UserDetailModal';
import AdminLayout from '../components/admin/AdminLayout';

const UsersContainer = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;

  .header {
    margin-bottom: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--border-color);

    .title-section {
      h1 {
        margin: 0 0 8px 0;
        font-size: 2.25rem;
        font-weight: 700;
        color: var(--text-color);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .subtitle {
        color: var(--muted-color);
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 8px;

        svg {
          width: 16px;
          height: 16px;
        }
      }
    }

    .stats-summary {
      display: flex;
      gap: 24px;

      .stat-item {
        text-align: center;
        padding: 12px 20px;
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--muted-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }
    }
  }

  .filters-card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--border-color);

    .filters-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;

      svg {
        width: 20px;
        height: 20px;
        color: var(--primary-color);
      }
    }

    .filters {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 12px;
      align-items: end;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }

      .input-group {
        display: flex;
        flex-direction: column;
        gap: 6px;

        label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-color);
          margin-left: 4px;
        }

        input,
        select {
          padding: 12px 16px;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          background: var(--card-bg);
          color: var(--text-color);
          font-size: 0.95rem;
          transition: all 0.3s ease;

          &:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
            transform: translateY(-1px);
          }

          &::placeholder {
            color: var(--muted-color);
          }
        }

        select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 40px;
          appearance: none;
        }
      }

      .search-button {
        padding: 12px 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: center;

        svg {
          width: 18px;
          height: 18px;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }
  }

  .content-card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--border-color);
    min-height: 400px;
  }

  .loading,
  .error {
    padding: 60px 20px;
    text-align: center;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    svg {
      width: 48px;
      height: 48px;
      animation: spin 1s linear infinite;
    }

    .message {
      font-size: 1.1rem;
      font-weight: 500;
    }
  }

  .loading {
    color: var(--primary-color);
  }

  .error {
    background: linear-gradient(135deg, #ffe5e5 0%, #ffd1d1 100%);
    color: #c92a2a;
    border: 2px solid #ff6b6b;

    svg {
      animation: none;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { page, limit, q: query, status } });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = useCallback(
    async (id) => {
      // eslint-disable-next-line no-restricted-globals
      if (window.confirm('Delete this user?')) {
        try {
          await api.delete(`/admin/users/${id}`);
          fetchUsers();
        } catch (err) {
          console.error('Delete failed', err);
        }
      }
    },
    [fetchUsers]
  );

  const handleBanUnban = useCallback(
    async (id, action) => {
      try {
        await api.post(`/admin/users/${id}/ban`, { action });
        fetchUsers();
      } catch (err) {
        console.error('Ban/unban failed', err);
      }
    },
    [fetchUsers]
  );

  return (
    <AdminLayout>
      <UsersContainer>
        <div className="header">
          <div className="title-section">
            <h1>User Management</h1>
            <p className="subtitle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Manage users, view details, and control access
            </p>
          </div>
          
          {data && (
            <div className="stats-summary">
              <div className="stat-item">
                <div className="stat-value">{data.total || 0}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{data.page || 1}</div>
                <div className="stat-label">Current Page</div>
              </div>
            </div>
          )}
        </div>

        <div className="filters-card">
          <div className="filters-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Search & Filter
          </div>
          <div className="filters">
            <div className="input-group">
              <label>Search Users</label>
              <input
                placeholder="Enter name or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && setPage(1)}
              />
            </div>
            <div className="input-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </div>
            <button className="search-button" onClick={() => setPage(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Search
            </button>
          </div>
        </div>

        <div className="content-card">
          {loading && (
            <div className="loading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <div className="message">Loading users...</div>
            </div>
          )}
          
          {!loading && data && (
            <UsersTable
              users={data?.users || []}
              page={data?.page || 1}
              perPage={data?.perPage || limit}
              total={data?.total || 0}
              onPageChange={(p) => setPage(p)}
              onView={(u) => setSelectedUser(u)}
              onDelete={handleDelete}
              onBanUnban={handleBanUnban}
            />
          )}
        </div>

        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdated={() => {
              setSelectedUser(null);
              fetchUsers();
            }}
          />
        )}
      </UsersContainer>
    </AdminLayout>
  );
}