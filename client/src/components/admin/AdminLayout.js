import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBarChart2, FiUsers, FiTrendingUp, FiArrowLeft } from 'react-icons/fi';

const LayoutContainer = styled.div`
  min-height: 100vh;
  padding-top: 80px;
`;

const NavTabs = styled.nav`
  background: var(--card-bg);
  border-bottom: 2px solid var(--border-color);
  padding: 0;
  margin: 0;
  position: sticky;
  top: 80px;
  z-index: 100;

  display: flex;
  gap: 0;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;

  @media (max-width: 768px) {
    padding: 0 20px;
    overflow-x: auto;

    &::-webkit-scrollbar {
      height: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--muted-color);
      border-radius: 2px;
    }
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 15px 10px;
  color: var(--muted-color);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-size: 1rem;
  margin-right: 10px;
  border-right: 1px solid var(--border-color);

  &:hover {
    color: var(--text-color);
  }

  svg {
    font-size: 1.2rem;
  }

  @media (max-width: 768px) {
    padding: 15px 8px;
    margin-right: 8px;

    span {
      display: none;
    }
  }
`;

const NavTab = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 15px 20px;
  font-size: 1rem;
  color: var(--muted-color);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  white-space: nowrap;

  &:hover {
    color: var(--text-color);
  }

  ${(props) =>
    props.active &&
    `
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  `}

  svg {
    font-size: 1.2rem;
  }
`;

const ContentArea = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 40px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <FiBarChart2 /> },
    { path: '/admin/users', label: 'Users', icon: <FiUsers /> },
    { path: '/admin/analytics', label: 'Analytics', icon: <FiTrendingUp /> },
  ];

  return (
    <LayoutContainer>
      <NavTabs>
        <BackButton onClick={() => navigate('/')} title="Back to Home">
          <FiArrowLeft />
          <span>Back</span>
        </BackButton>
        {navItems.map((item) => (
          <NavTab
            key={item.path}
            active={isActive(item.path)}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {item.label}
          </NavTab>
        ))}
      </NavTabs>
      <ContentArea>{children}</ContentArea>
    </LayoutContainer>
  );
}
