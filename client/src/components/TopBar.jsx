import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

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
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const BackArrow = styled.button`
  background: none;
  border: none;
  color: #005670;
  font-size: 1.8rem;
  cursor: pointer;
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
  line-height: 1;
  margin-right: 1rem;
  height: 100%;
  transition: transform 0.2s ease, color 0.2s ease;
  outline: none;

  &:focus {
    outline: none;
    box-shadow: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: none;
  }

  &:hover {
    color: #004560;
    transform: translateX(-3px);
  }

  &:active {
    transform: translateX(-1px);
  }

  &::before {
    content: '←';
  }
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
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in on mount
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    // Fade out before navigation
    setVisible(false);
    setTimeout(() => {
      navigate('/dashboard', { 
        state: { 
          preserveState: true,
          fromDetail: true 
        }
      });
    }, 200); // Slightly shorter than the transition duration
  };

  const showBackButton = location.pathname !== '/dashboard';

  return (
    <TopBarContainer $visible={visible}>
      {showBackButton && <BackArrow onClick={handleBack} />}
      <AppTitle>Klima Kontrol</AppTitle>
      {user && locationName && <LocationName>{locationName}</LocationName>}
      {user ? (
        <UserSection>
          <UserInfo>Welcome, {user.username}</UserInfo>
          <LogoutButton onClick={logout}>Logout</LogoutButton>
        </UserSection>
      ) : (
        children
      )}
    </TopBarContainer>
  );
};

export default TopBar; 