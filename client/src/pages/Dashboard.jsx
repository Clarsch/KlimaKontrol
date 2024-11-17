import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import TopBar from '../components/TopBar';
import LocationsOverview from '../components/LocationsOverview';
import { useLocation } from 'react-router-dom';

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

// Areas data (in real app, this would come from an API)
const areas = {
  "Aabenraa Sogn": [
    "Aabenraa Sankt Nicolai Kirke",
    "Løjt Kirke",
    "Rise Kirke",
    "Hjordkær Kirke",
    "Bjolderup Kirke",
    "Ensted Kirke",
    "Varnæs Kirke",
    "Felsted Kirke",
    "Kliplev Kirke",
    "Kværs Kirke",
    "Holbøl Kirke",
    "Bov Kirke",
    "Kollund Kirke"
  ],
  "Haderslev Sogn": [
    "Haderslev Domkirke",
    "Gl. Haderslev Kirke",
    "Sct. Severin Kirke",
    "Vojens Kirke",
    "Hammelev Kirke",
    "Moltrup Kirke",
    "Bjerning Kirke",
    "Grarup Kirke",
    "Halk Kirke",
    "Øsby Kirke",
    "Vilstrup Kirke",
    "Starup Kirke",
    "Vonsbæk Kirke"
  ],
  "Tønder Sogn": [
    "Tønder Kristkirke",
    "Abild Kirke",
    "Møgeltønder Kirke",
    "Ubjerg Kirke",
    "Højer Kirke",
    "Emmerlev Kirke",
    "Daler Kirke",
    "Visby Kirke",
    "Hostrup Kirke",
    "Højst Kirke",
    "Bylderup Kirke",
    "Burkal Kirke",
    "Tinglev Kirke"
  ],
  "Sønderborg Sogn": [
    "Sønderborg Christianskirke",
    "Sankt Marie Kirke",
    "Christians Kirke",
    "Ulkebøl Kirke",
    "Augustenborg Slotskirke",
    "Hørup Kirke",
    "Kegnæs Kirke",
    "Lysabild Kirke",
    "Tandslet Kirke",
    "Asserballe Kirke",
    "Notmark Kirke",
    "Egen Kirke",
    "Svenstrup Kirke",
    "Havnbjerg Kirke",
    "Nordborg Kirke",
    "Oksbøl Kirke",
  ]
};

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedAreas, setExpandedAreas] = useState(() => {
    try {
      const saved = sessionStorage.getItem('dashboardState');
      return saved ? JSON.parse(saved).expandedAreas : {};
    } catch (error) {
      return {};
    }
  });

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
          // Use a small timeout to ensure the DOM is ready
          setTimeout(() => {
            window.scrollTo(0, scrollPosition);
          }, 100);
        }
      } catch (error) {
        console.error('Error restoring dashboard state:', error);
      }
    } else {
      // Clear saved state if not preserving
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