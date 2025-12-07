import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;

const ChartBox = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: var(--text-color);
    font-size: 1.1rem;
  }

  .chart-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  .loading,
  .error {
    text-align: center;
    color: var(--muted-color);
  }

  .error {
    color: #e74c3c;
  }
`;

export default function Charts() {
  const [metrics, setMetrics] = useState({
    new_users: [],
    api_events: [],
    searches: [],
    discord_notifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Fetch each metric separately
        const [newUsersRes, apiEventsRes, searchesRes, discordRes] = await Promise.all([
          api.get('/admin/metrics?metric=new_users&days=30&bucket=day'),
          api.get('/admin/metrics?metric=api_events&days=30&bucket=day'),
          api.get('/admin/metrics?metric=searches&days=30&bucket=day'),
          api.get('/admin/metrics?metric=discord_notifications&days=30&bucket=day'),
        ]);

        if (!mounted) return;

        setMetrics({
          new_users: newUsersRes.data?.data || [],
          api_events: apiEventsRes.data?.data || [],
          searches: searchesRes.data?.data || [],
          discord_notifications: discordRes.data?.data || [],
        });
      } catch (err) {
        console.error('Failed to load metrics', err);
        if (mounted) {
          setError(err.response?.data?.message || 'Failed to load metrics');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <ChartsContainer>
        <ChartBox>
          <div className="loading">Loading charts...</div>
        </ChartBox>
      </ChartsContainer>
    );
  }

  if (error) {
    return (
      <ChartsContainer>
        <ChartBox>
          <div className="error">{error}</div>
        </ChartBox>
      </ChartsContainer>
    );
  }

  const hasData =
    metrics.new_users.length > 0 ||
    metrics.api_events.length > 0 ||
    metrics.searches.length > 0 ||
    metrics.discord_notifications.length > 0;

  if (!hasData) {
    return (
      <ChartsContainer>
        <ChartBox>
          <div className="loading">No data available yet</div>
        </ChartBox>
      </ChartsContainer>
    );
  }

  // Prepare data for charts
  const newUsersData = (metrics.new_users || []).map((item) => ({
    name: new Date(item._id).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    count: item.count,
  }));

  const apiEventsData = (metrics.api_events || []).map((item) => ({
    name: new Date(item._id).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    count: item.count,
  }));

  const searchesData = (metrics.searches || []).map((item) => ({
    name: new Date(item._id).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    count: item.count,
  }));

  const discordData = (metrics.discord_notifications || []).map((item) => ({
    name: new Date(item._id).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    count: item.count,
  }));

  // Colors for charts
  const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'];

  return (
    <ChartsContainer>
      {/* New Users Chart */}
      <ChartBox>
        <h3>New Users (Last 30 Days)</h3>
        <div className="chart-wrapper">
          {newUsersData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={newUsersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--muted-color)" />
                <YAxis stroke="var(--muted-color)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-color)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="loading">No data</div>
          )}
        </div>
      </ChartBox>

      {/* API Usage Chart */}
      <ChartBox>
        <h3>API Usage (Last 30 Days)</h3>
        <div className="chart-wrapper">
          {apiEventsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={apiEventsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--muted-color)" />
                <YAxis stroke="var(--muted-color)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-color)',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="loading">No data</div>
          )}
        </div>
      </ChartBox>

      {/* Searches Chart */}
      <ChartBox>
        <h3>Searches (Last 30 Days)</h3>
        <div className="chart-wrapper">
          {searchesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={searchesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--muted-color)" />
                <YAxis stroke="var(--muted-color)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-color)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#d946ef"
                  strokeWidth={2}
                  dot={{ fill: '#d946ef', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="loading">No data</div>
          )}
        </div>
      </ChartBox>

      {/* Discord Notifications Chart */}
      <ChartBox>
        <h3>Discord Notifications (Last 30 Days)</h3>
        <div className="chart-wrapper">
          {discordData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={discordData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--muted-color)" />
                <YAxis stroke="var(--muted-color)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-color)',
                  }}
                />
                <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="loading">No data</div>
          )}
        </div>
      </ChartBox>
    </ChartsContainer>
  );
}
