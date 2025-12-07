import React from 'react';
import styled from 'styled-components';
import AdminLayout from '../components/admin/AdminLayout';
import Charts from '../components/admin/Charts';

const AnalyticsContainer = styled.div`
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
`;

export default function AdminAnalytics() {
  return (
    <AdminLayout>
      <AnalyticsContainer>
        <div className="header">
          <h1>Analytics</h1>
          <p className="subtitle">Detailed insights and metrics (Last 30 days)</p>
        </div>

        <Charts />
      </AnalyticsContainer>
    </AdminLayout>
  );
}
