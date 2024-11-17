import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import TopBar from '../components/TopBar';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 80px;
`;

const Content = styled.div`
  padding: 2rem;
`;

const RoleSpecificContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const UploadLink = styled(Link)`
  display: inline-block;
  background-color: #005670;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 1.5rem;
  font-size: 1.1rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #004560;
  }
`;

const Dashboard = () => {
  const { user } = useAuth();

  const renderRoleSpecificContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <RoleSpecificContent>
            <h2>Admin Dashboard</h2>
            <p>Welcome to the admin dashboard. Here you can:</p>
            <ul>
              <li>Manage users</li>
              <li>Manage locations</li>
              <li>View system settings</li>
            </ul>
          </RoleSpecificContent>
        );
      case 'monitoring':
        return (
          <RoleSpecificContent>
            <h2>Monitoring Dashboard</h2>
            <p>Welcome to the monitoring dashboard. Here you can:</p>
            <ul>
              <li>View all locations</li>
              <li>Check environmental data</li>
              <li>Manage warnings</li>
            </ul>
          </RoleSpecificContent>
        );
      case 'collector':
        return (
          <RoleSpecificContent>
            <h2>Data Collector Dashboard</h2>
            <p>Welcome to the data collector dashboard.</p>
            <p>Your assigned location:</p>
            <ul>
              {user?.locations?.map((location) => (
                <li key={location}>{location}</li>
              ))}
            </ul>
            <UploadLink to="/upload">+ Upload New Data</UploadLink>
          </RoleSpecificContent>
        );
      default:
        return <div>Invalid role</div>;
    }
  };

  // Get location name based on role
  const getLocationName = () => {
    switch (user?.role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'monitoring':
        return 'Monitoring Dashboard';
      case 'collector':
        return user?.locations?.[0] || 'Data Collector Dashboard';
      default:
        return '';
    }
  };

  return (
    <DashboardContainer>
      <TopBar locationName={getLocationName()} />
      <Content>
        {renderRoleSpecificContent()}
      </Content>
    </DashboardContainer>
  );
};

export default Dashboard; 