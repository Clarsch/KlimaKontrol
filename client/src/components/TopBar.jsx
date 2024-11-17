import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TopBarContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
`;

const AppTitle = styled.h1`
  color: #005670;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  flex: 1;
`;

const LocationName = styled.h2`
  color: #005670;
  font-size: 1.4rem;
  font-weight: 500;
  margin: 0;
  text-align: center;
  flex: 1;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: flex-end;
`;

const UserInfo = styled.span`
  color: #005670;
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1.5rem;
  background-color: #005670;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: #004560;
  }
`;

const TopBar = ({ children, locationName }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <TopBarContainer>
      <AppTitle>Klima Kontrol</AppTitle>
      {user && locationName && <LocationName>{locationName}</LocationName>}
      {user ? (
        <UserSection>
          <UserInfo>Welcome, {user.username}</UserInfo>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </UserSection>
      ) : (
        children
      )}
    </TopBarContainer>
  );
};

export default TopBar; 