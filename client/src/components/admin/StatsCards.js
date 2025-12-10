import React from 'react';
import styled from 'styled-components';
import { FiUsers, FiActivity, FiServer, FiShare2 } from 'react-icons/fi';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const Card = styled.div`
  background: var(--card-bg);
  padding: 24px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  gap: 20px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
    border-color: rgba(99, 102, 241, 0.2);
  }
`;

const IconWrapper = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  background: ${props => props.bg || 'var(--bg-color)'};
  color: ${props => props.color || 'var(--text-color)'};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  
  .label {
    font-size: 0.9rem;
    color: var(--muted-color);
    margin-bottom: 4px;
    font-weight: 500;
  }
  
  .value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1.2;
  }
`;

export default function StatsCards({ stats }) {
  return (
    <Grid>
      <Card>
        <IconWrapper bg="rgba(99, 102, 241, 0.1)" color="#6366f1">
          <FiUsers />
        </IconWrapper>
        <Content>
          <span className="label">Total Users</span>
          <span className="value">{stats.usersCount || 0}</span>
        </Content>
      </Card>

      <Card>
        <IconWrapper bg="rgba(16, 185, 129, 0.1)" color="#10b981">
          <FiActivity />
        </IconWrapper>
        <Content>
          <span className="label">Active (7d)</span>
          <span className="value">{stats.active7d || 'N/A'}</span>
        </Content>
      </Card>

      <Card>
        <IconWrapper bg="rgba(245, 158, 11, 0.1)" color="#f59e0b">
          <FiServer />
        </IconWrapper>
        <Content>
          <span className="label">API Calls (Today)</span>
          <span className="value">{stats.eventsToday || 0}</span>
        </Content>
      </Card>

      <Card>
        <IconWrapper bg="rgba(236, 72, 153, 0.1)" color="#ec4899">
          <FiShare2 />
        </IconWrapper>
        <Content>
          <span className="label">Discord Clients</span>
          <span className="value">{stats.discordConnections || 'N/A'}</span>
        </Content>
      </Card>
    </Grid>
  );
}
