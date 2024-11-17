import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AreaContainer = styled.div`
  margin: 1rem 0;
`;

const AreaBar = styled.div`
  display: flex;
  align-items: center;
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f8f8;
  }
`;

const AreaHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const AreaLabel = styled.div`
  min-width: 200px;
  color: #005670;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 250px;
`;

const Arrow = styled.span`
  transition: transform 0.3s ease;
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-left: 0.5rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border-right: 2px solid #005670;
    border-bottom: 2px solid #005670;
    transform: ${props => props.$isExpanded 
      ? 'rotate(-135deg)'  // Point up when expanded
      : 'rotate(45deg)'}; // Point down when collapsed
    transition: transform 0.3s ease;
    transform-origin: 50% 50%;
  }
`;

const LocationsContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-grow: 1;
`;

const LocationDot = styled.div`
  width: 16px;
  height: 16px;
  background-color: ${props => props.$hasWarning ? '#FF0000' : '#00FF00'};
  border-radius: 50%;
  transition: transform 0.2s ease;
  position: relative;
  cursor: pointer;

  &:hover {
    transform: scale(1.2);
  }

  &:hover::after {
    content: '${props => props.$locationName}';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-size: 0.875rem;
    white-space: nowrap;
    margin-bottom: 0.5rem;
    z-index: 1;
  }
`;

const ExpandedArea = styled.div`
  margin-top: 0.5rem;
  margin-left: 2rem;
  display: ${props => props.$isExpanded ? 'block' : 'none'};
`;

const LocationRow = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: white;
  border-radius: 4px;
  margin: 0.5rem 0;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f8f8;
  }
`;

const LocationName = styled.div`
  flex: 1;
  color: #005670;
`;

const LocationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const WarningCount = styled.div`
  color: ${props => props.$hasWarnings ? '#FF0000' : '#00FF00'};
  font-weight: bold;
  min-width: 30px;
  text-align: center;
`;

const LocationsOverview = ({ areas }) => {
  const navigate = useNavigate();
  const [locationStatuses, setLocationStatuses] = useState({});
  const [expandedAreas, setExpandedAreas] = useState({});

  useEffect(() => {
    const fetchLocationStatuses = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/data/locations/status');
        setLocationStatuses(response.data);
      } catch (error) {
        console.error('Error fetching location statuses:', error);
      }
    };

    fetchLocationStatuses();
  }, []);

  const toggleArea = (areaName) => {
    setExpandedAreas(prev => ({
      ...prev,
      [areaName]: !prev[areaName]
    }));
  };

  const handleLocationClick = (location) => {
    navigate(`/location/${encodeURIComponent(location)}`);
  };

  return (
    <div>
      {Object.entries(areas).map(([areaName, locations]) => (
        <AreaContainer key={areaName}>
          <AreaBar onClick={() => toggleArea(areaName)}>
            <AreaHeader>
              <AreaLabel>
                {areaName}
                <Arrow $isExpanded={expandedAreas[areaName]} />
              </AreaLabel>
              <LocationsContainer>
                {locations.map(location => (
                  <LocationDot
                    key={location}
                    $hasWarning={locationStatuses[location]?.hasActiveWarnings}
                    $locationName={location}
                    onClick={() => handleLocationClick(location)}
                  />
                ))}
              </LocationsContainer>
            </AreaHeader>
          </AreaBar>
          
          <ExpandedArea $isExpanded={expandedAreas[areaName]}>
            {locations.map(location => {
              const warnings = locationStatuses[location]?.warnings || [];
              const activeWarnings = warnings.filter(w => w.status === 'active').length;
              
              return (
                <LocationRow 
                  key={location}
                  onClick={() => handleLocationClick(location)}
                >
                  <LocationName>{location}</LocationName>
                  <LocationStatus>
                    <LocationDot 
                      $hasWarning={locationStatuses[location]?.hasActiveWarnings}
                      $locationName={location}
                    />
                    <WarningCount $hasWarnings={locationStatuses[location]?.hasActiveWarnings}>
                      {locationStatuses[location]?.activeWarningCount || 0}
                    </WarningCount>
                  </LocationStatus>
                </LocationRow>
              );
            })}
          </ExpandedArea>
        </AreaContainer>
      ))}
    </div>
  );
};

export default LocationsOverview; 