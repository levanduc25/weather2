import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import api from '../../services/api';

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  gap: 24px;
  margin-top: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ChartBox = styled.div`
  background: var(--card-bg);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  }

  h3 {
    margin: 0 0 24px 0;
    color: var(--text-color);
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: '';
      display: block;
      width: 4px;
      height: 16px;
      background: var(--primary-color);
      border-radius: 2px;
    }
  }

  .chart-wrapper {
    height: 320px;
    width: 100%;
    
    .recharts-cartesian-grid-horizontal line,
    .recharts-cartesian-grid-vertical line {
      stroke: var(--border-color);
      stroke-opacity: 0.5;
    }

    .recharts-text {
      fill: var(--muted-color);
      font-size: 0.8rem;
    }
  }

  .loading, .error {
    height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted-color);
    font-weight: 500;
  }

  .error { color: #ef4444; }
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
        if (mounted) setError('Failed to load metrics data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMetrics();
    return () => { mounted = false; };
  }, []);

  if (loading) return (
    <ChartsContainer>
      {[1, 2, 3, 4].map(i => (
        <ChartBox key={i}>
          <div className="loading">Loading analytics...</div>
        </ChartBox>
      ))}
    </ChartsContainer>
  );

  const formatData = (data) => (data || []).map(item => ({
    name: new Date(item._id).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    fullDate: new Date(item._id).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'long' }),
    count: item.count,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          padding: '12px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--muted-color)' }}>{payload[0].payload.fullDate}</p>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-color)', fontSize: '1.1rem' }}>
            {payload[0].value} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>events</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartsContainer>
      <ChartBox>
        <h3>New Users Growth</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatData(metrics.new_users)}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
              <YAxis axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>

      <ChartBox>
        <h3>API Request Volume</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatData(metrics.api_events)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
              <YAxis axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>

      <ChartBox>
        <h3>Search Trends</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatData(metrics.searches)}>
              <defs>
                <linearGradient id="colorSearch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
              <YAxis axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#ec4899" fillOpacity={1} fill="url(#colorSearch)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>

      <ChartBox>
        <h3>Discord Notifications</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatData(metrics.discord_notifications)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
              <YAxis axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartBox>
    </ChartsContainer>
  );
}
