import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import TopBar from '../components/TopBar';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 80px;
`;

const Content = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const WarningCard = styled(Card)`
  border-left: 4px solid ${props => props.$status === 'active' ? '#FF0000' : '#FFA500'};
`;

const Title = styled.h2`
  color: #005670;
  margin-bottom: 2rem;
`;

const WarningsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LocationDetail = () => {
  const { locationId } = useParams();
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/data/location/${encodeURIComponent(locationId)}`);
        setLocationData(response.data);
      } catch (err) {
        setError('Error fetching location data');
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
  }, [locationId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <PageContainer>
      <TopBar locationName={locationId} />
      <Content>
        <Title>{locationId}</Title>
        
        {/* Warnings Section */}
        <Card>
          <h3>Warnings</h3>
          <WarningsList>
            {locationData?.warnings?.length > 0 ? (
              locationData.warnings.map(warning => (
                <WarningCard key={warning.id} $status={warning.status}>
                  <h4>{warning.type}</h4>
                  <p>{warning.message}</p>
                </WarningCard>
              ))
            ) : (
              <p>No active warnings</p>
            )}
          </WarningsList>
        </Card>

        {/* Add more sections for graphs and other data */}
      </Content>
    </PageContainer>
  );
};

export default LocationDetail; 