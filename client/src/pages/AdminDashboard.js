import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../services/api';
import StatsCards from '../components/admin/StatsCards';
import Charts from '../components/admin/Charts';
import AdminLayout from '../components/admin/AdminLayout';

const DashboardContainer = styled.div`
  .header {
    margin-bottom: 30px;

    h1 {
      margin: 0 0 10px 0;
      font-size: 2rem;
      color: var(--text-color);
    }

    .subtitle {
      color: var(--muted-color);
      font-size: 0.95rem;
    }
  }

  .loading,
  .error {
    padding: 20px;
    text-align: center;
    border-radius: 8px;
    background: var(--card-bg);
  }

  .error {
    background: #ffe5e5;
    color: #c92a2a;
  }

  .loading {
    color: var(--muted-color);
  }
`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/stats');
        if (!mounted) return;
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
        setError(err.response?.data?.message || err.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminLayout>
      <DashboardContainer>
        <div className="header">
          <h1>Dashboard Overview</h1>
          <p className="subtitle">Real-time statistics and analytics</p>
        </div>

        {loading && <div className="loading">Loading dashboard...</div>}
        {error && <div className="error">{error}</div>}
        {stats && (
          <>
            <StatsCards stats={stats} />
            <Charts />
          </>
        )}
      </DashboardContainer>
    </AdminLayout>
  );
}
