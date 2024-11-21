import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import TopBar from '../components/TopBar';
import LocationsOverview from '../components/LocationsOverview';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 80px;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translateY(${props => props.$visible ? '0' : '20px'});
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

const Content = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.entering {
    opacity: 0;
    transform: translateY(20px);
  }
`;

const Title = styled.h2`
  color: #005670;
  margin-bottom: 2rem;
`;

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [areas, setAreas] = useState([]);
  const [locations, setLocations] = useState({});
  const [expandedAreas, setExpandedAreas] = useState(() => {
    try {
      const saved = sessionStorage.getItem('dashboardState');
      return saved ? JSON.parse(saved).expandedAreas : {};
    } catch (error) {
      return {};
    }
  });
  const [isEntering, setIsEntering] = useState(true);
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch locations data
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get('http://localhost:5001/api/data/locations');
        const locationsMap = response.data.reduce((acc, location) => {
          acc[location.id] = {
            id: location.id,
            name: location.name,
            settings: location.settings,
            thresholds: location.thresholds,
            warnings: location.warnings,
            status: location.status,
            lastUpdate: location.lastUpdate,
            groundTemperature: location.groundTemperature,
            environmentalData: location.environmentalData
          };
          return acc;
        }, {});
        setLocations(locationsMap);
      } catch (error) {
        setError('Failed to load locations');
        console.error('Error fetching locations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Fetch areas data
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/data/areas');
        setAreas(response.data);
      } catch (error) {
        console.error('Error fetching areas:', error);
        setError('Failed to load areas');
      }
    };

    // Only fetch areas after locations are loaded
    if (Object.keys(locations).length > 0) {
      fetchAreas();
    }
  }, [locations]);

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

  useEffect(() => {
    // Trigger enter animation
    setIsEntering(false);
  }, []);

  useEffect(() => {
    // Fade in on mount
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleAreaToggle = (areaName) => {
    setExpandedAreas(prev => ({
      ...prev,
      [areaName]: !prev[areaName]
    }));
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState message="Loading locations..." />;
    }

    if (error) {
      return <ErrorMessage>{error}</ErrorMessage>;
    }

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
    <DashboardContainer $visible={visible}>
      <TopBar locationName="Dashboard" />
      <Content className={isEntering ? 'entering' : ''}>
        {renderContent()}
      </Content>
    </DashboardContainer>
  );
};

export default Dashboard; 