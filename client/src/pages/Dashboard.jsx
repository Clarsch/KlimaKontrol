import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import TopBar from '../components/TopBar';
import LocationsOverview from '../components/LocationsOverview';

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

  const renderContent = () => {
    switch (user?.role) {
      case 'admin':
      case 'monitoring':
        return (
          <>
            <Title>Locations Overview</Title>
            <LocationsOverview areas={areas} />
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