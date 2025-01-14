import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

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
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  flex-grow: 1;
  overflow: hidden;
  padding: 1rem;
`;

const LocationDot = styled.div`
  width: 16px;
  height: 16px;
  background-color: ${props => props.$hasWarning ? '#FF0000' : '#44FF44'};
  border-radius: 50%;
  transition: transform 0.2s ease;
  position: relative;
  cursor: pointer;

  &:hover {
    transform: scale(1.2);
  }

  &:hover::after {
    content: '${props => props.$locationDisplayName}${props => props.$warningCount ? ` (${props.$warningCount} warnings)` : ''}';
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

const StatusIndicator = styled.div`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: ${props => props.$status === 'ok' ? '#00FF00' : '#FF0000'};
  background-color: ${props => props.$status === 'ok' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)'};
`;

const LocationsOverview = ({ 
    areas = [], 
    locationStatuses = {}, 
    expandedAreas = {}, 
    onAreaToggle 
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div>
            {Array.isArray(areas) && areas.map((area) => (
                <AreaContainer key={area.name}>
                    <AreaBar onClick={() => onAreaToggle(area.name)}>
                        <AreaHeader>
                            <AreaLabel>
                                {area.name}
                                <Arrow $isExpanded={expandedAreas[area.name]} />
                            </AreaLabel>
                            <LocationsContainer>
                                {Array.isArray(area.locations) && area.locations.map(location => {
                                    const status = locationStatuses[location.id];
                                    const warningCount = status?.warnings?.length || 0;
                                    
                                    return (
                                        <LocationDot
                                            key={location.id}
                                            $hasWarning={warningCount > 0}
                                            $locationDisplayName={status?.name || t('unknown_location', {locationName: location.id})}
                                            $warningCount={warningCount}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/location/${encodeURIComponent(location.id)}`);
                                            }}
                                        />
                                    );
                                })}
                            </LocationsContainer>
                        </AreaHeader>
                    </AreaBar>
                    
                    <ExpandedArea $isExpanded={expandedAreas[area.name]}>
                        {Array.isArray(area.locations) && area.locations.map(location => {
                            const locationStatus = locationStatuses[location.id];
                            if (!locationStatus) {
                                return (
                                    <LocationRow key={location.id}>
                                        <LocationName>{t('no_status_for_location', {locationName: location.id})}</LocationName>
                                    </LocationRow>
                                );
                            }

                            return (
                                <LocationRow 
                                    key={location.id}
                                    onClick={() => navigate(`/location/${encodeURIComponent(location.id)}`)}
                                >
                                    <LocationName>{locationStatus.name}</LocationName>
                                    <LocationStatus>
                                        <WarningCount $hasWarnings={locationStatus.warnings?.length > 0}>
                                            {locationStatus.warnings?.length || 0}
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

LocationsOverview.propTypes = {
  areas: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    locations: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired
    })).isRequired
  })).isRequired,
  locationStatuses: PropTypes.objectOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    hasActiveWarnings: PropTypes.bool.isRequired,
    warnings: PropTypes.arrayOf(PropTypes.shape({
      active: PropTypes.bool.isRequired
    })).isRequired
  })).isRequired,
  expandedAreas: PropTypes.object.isRequired,
  onAreaToggle: PropTypes.func.isRequired
};

export default LocationsOverview; 