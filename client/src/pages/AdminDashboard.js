import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../services/api';
import StatsCards from '../components/admin/StatsCards';
import Charts from '../components/admin/Charts';
import AdminLayout from '../components/admin/AdminLayout';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;

  .header {
    margin-bottom: 24px;
    
    h1 {
      margin: 0 0 8px 0;
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: var(--muted-color);
      font-size: 1rem;
    }
  }

  .loading-container,
  .error-container {
    padding: 40px;
    text-align: center;
    border-radius: 16px;
    background: var(--card-bg);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
  }

  .error-container {
    background: linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%);
    color: #c92a2a;
    border-color: #ffc9c9;
  }

  .loading-container {
    color: var(--muted-color);
    font-size: 1.1rem;
    
    .spinner {
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-left-color: var(--primary-color);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        if (mounted) {
          setStats(res.data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load admin stats', err);
        if (mounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load dashboard statistics');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchStats();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminLayout>
      <DashboardContainer>
        <div className="header">
          <h1>Dashboard Overview</h1>
          <p className="subtitle">Real-time statistics and system analytics</p>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="spinner" />
            Loading dashboard data...
          </div>
        )}

        {error && (
          <div className="error-container">
            <h3>Error Loading Dashboard</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            <StatsCards stats={stats} />
            <Charts />
          </>
        )}
      </DashboardContainer>
    </AdminLayout>
  );
}
