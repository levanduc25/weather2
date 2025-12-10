import React from 'react';
import styled from 'styled-components';
import AdminLayout from '../components/admin/AdminLayout';
import Charts from '../components/admin/Charts';

const AnalyticsContainer = styled.div`
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
