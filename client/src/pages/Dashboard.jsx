import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import TopBar from '../components/TopBar';
import LocationsOverview from '../components/LocationsOverview';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 80px;
`;

const Content = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: #005670;
  margin-bottom: 2rem;
`;

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [areas, setAreas] = useState({});
  const [expandedAreas, setExpandedAreas] = useState(() => {
    try {
      const saved = sessionStorage.getItem('dashboardState');
      return saved ? JSON.parse(saved).expandedAreas : {};
    } catch (error) {
      return {};
    }
  });

  // Fetch areas data
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/data/areas');
        const areasObject = response.data.reduce((acc, area) => {
          acc[area.name] = area.locations;
          return acc;
        }, {});
        setAreas(areasObject);
      } catch (error) {
        console.error('Error fetching areas:', error);
      }
    };

    fetchAreas();
  }, []);

  // Save expanded areas state whenever it changes
  useEffect(() => {
    try {
      const scrollPos = window.scrollY;
      sessionStorage.setItem('dashboardState', JSON.stringify({
        expandedAreas,
        scrollPosition: scrollPos
      }));
    } catch (error) {
      console.error('Error saving dashboard state:', error);
    }
  }, [expandedAreas]);

  // Handle scroll position preservation
  useEffect(() => {
    const handleScroll = () => {
      try {
        const currentState = JSON.parse(sessionStorage.getItem('dashboardState') || '{}');
        sessionStorage.setItem('dashboardState', JSON.stringify({
          ...currentState,
          scrollPosition: window.scrollY
        }));
      } catch (error) {
        console.error('Error saving scroll position:', error);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore state when returning to dashboard
  useEffect(() => {
    if (location.state?.preserveState) {
      try {
        const savedState = sessionStorage.getItem('dashboardState');
        if (savedState) {
          const { scrollPosition } = JSON.parse(savedState);
          setTimeout(() => {
            window.scrollTo(0, scrollPosition);
          }, 100);
        }
      } catch (error) {
        console.error('Error restoring dashboard state:', error);
      }
    } else {
      sessionStorage.removeItem('dashboardState');
      window.scrollTo(0, 0);
    }
  }, [location.state]);

  const handleAreaToggle = (areaName) => {
    setExpandedAreas(prev => ({
      ...prev,
      [areaName]: !prev[areaName]
    }));
  };

  const renderContent = () => {
    switch (user?.role) {
      case 'admin':
      case 'monitoring':
        return (
          <>
            <Title>Locations Overview</Title>
            <LocationsOverview 
              areas={areas} 
              expandedAreas={expandedAreas}
              onAreaToggle={handleAreaToggle}
            />
          </>
        );
      default:
        return <div>Access denied</div>;
    }
  };

  return (
    <DashboardContainer>
      <TopBar locationName="Dashboard" />
      <Content>
        {renderContent()}
      </Content>
    </DashboardContainer>
  );
};

export default Dashboard; 