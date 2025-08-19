import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import TopBar from '../components/TopBar';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import { withRetry } from '../utils/apiHelpers';
import { showSuccess } from '../components/SuccessMessage';
import PropTypes from 'prop-types';
import axiosInstance from '../api/axiosConfig';
import { useTranslation } from 'react-i18next';
import { formatTimestamp } from '../utils/formatters';
import GraphComponent from '../components/GraphComponent';
import { processGraphData, processCombinedGraphData } from '../utils/graphDataProcessor';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 80px;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translateY(${props => props.$visible ? '0' : '20px'});
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

const Content = styled.div`
  padding: 2rem 4rem;  /* Increased horizontal padding instead of width restriction */
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 3fr 1fr;  /* Changed from 2fr 1fr to 3fr 1fr for more graph space */
  gap: 2rem;

  /* Responsive padding for different screen sizes */
  @media (max-width: 1200px) {
    padding: 2rem 3rem;
    grid-template-columns: 2.5fr 1fr;  /* Still give more space to graphs */
  }

  @media (max-width: 768px) {
    padding: 2rem 2rem;
    grid-template-columns: 1fr;  /* Stack on smaller screens */
    gap: 1rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 1rem;
    gap: 1rem;
  }
`;

const MainSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;  /* Reduced gap for more compact layout */
  min-width: 0;  /* Allow content to wrap */
`;

const SideSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;  /* Reduced gap for more compact layout */
  min-width: 0;  /* Allow content to wrap */
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 0;  /* Allow content to wrap */
  overflow-wrap: break-word;  /* Ensure long text wraps */
  word-wrap: break-word;
`;

const WarningCard = styled(Card)`
  border-left: 4px solid ${props => props.$active ? '#FF0000' : '#00FF00'};
  margin-bottom: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const WarningHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WarningType = styled.span`
  font-weight: bold;
  color: ${props => props.$active ? '#FF0000' : '#008000'};
`;

const WarningTimestamp = styled.span`
  color: #666;
  font-size: 0.9em;
`;

const WarningMessage = styled.p`
  color: black;
  margin: 0;
`;

const DeactivateButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #FF0000;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;

  &:hover {
    background-color: #CC0000;
  }
`;

const Title = styled.h2`
  color: #005670;
  margin-bottom: 0.75rem;  /* Reduced margin for compactness */
  font-size: 1.4rem;  /* Slightly smaller for compactness */
`;

const SubTitle = styled.h3`
  color: #005670;
  margin-bottom: 0.75rem;  /* Reduced margin for compactness */
  font-size: 1.1rem;  /* Slightly smaller for compactness */
`;

const ThresholdGroup = styled.div`
  margin-bottom: 1rem;  /* Reduced margin for compactness */
`;

const ThresholdRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;  /* Reduced gap for compactness */
  margin-bottom: 0.5rem;
  flex-wrap: wrap;  /* Allow wrapping on small screens */
`;

const ThresholdLabel = styled.span`
  color: #005670;
  min-width: 100px;  /* Reduced from 120px for compactness */
  font-size: 0.9rem;  /* Slightly smaller font */
`;

const ThresholdInput = styled.input`
  padding: 0.4rem;  /* Reduced padding for compactness */
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 80px;  /* Reduced from 100px for compactness */
  font-size: 0.9rem;  /* Slightly smaller font */
`;

const SaveButton = styled.button`
  background-color: #005670;
  color: white;
  padding: 0.4rem 0.75rem;  /* Reduced padding for compactness */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.75rem;  /* Reduced margin for compactness */
  font-size: 0.9rem;  /* Slightly smaller font */

  &:hover {
    background-color: #004560;
  }
`;

const TimeRangeSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TimeButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.$active ? '#005670' : '#f0f0f0'};
  color: ${props => props.$active ? 'white' : '#005670'};

  &:hover {
    background-color: ${props => props.$active ? '#004560' : '#e0e0e0'};
  }

  &:disabled {
    background-color: #ccc;
    color: #666;
    cursor: not-allowed;
    
    &:hover {
      background-color: #ccc;
    }
  }
`;

const GraphCard = styled(Card)`
  min-height: 500px;
  height: auto;
  margin-bottom: 1.5rem;  /* Reduced margin for compactness */
  padding: 1rem 0.5rem 3rem 0.5rem;
  overflow: visible;
  width: 100%;  /* Ensure full width usage */
`;

const GraphTitle = styled.h4`
  color: #005670;
  margin-bottom: 0.75rem;  /* Reduced margin for compactness */
  font-size: 0.95rem;  /* Slightly smaller for compactness */
`;

const SettingsCard = styled(Card)`
  margin-bottom: 1.5rem;
  padding: 1.25rem;  /* Slightly reduced padding for compactness */
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;  /* Reduced gap for compactness */
  margin-bottom: 0.75rem;  /* Reduced margin for compactness */
  flex-wrap: wrap;  /* Allow wrapping on small screens */
`;

const SettingLabel = styled.span`
  color: #005670;
  min-width: 120px;  /* Reduced from 150px for compactness */
  font-size: 0.9rem;  /* Slightly smaller font */
`;

const SettingInput = styled.input`
  padding: 0.4rem;  /* Reduced padding for compactness */
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 80px;  /* Reduced from 100px for compactness */
  font-size: 0.9rem;  /* Slightly smaller font */
`;

const DeactivationInfo = styled.div`
  color: #666;
  font-size: 0.9em;
  font-style: italic;
  margin-top: 0.5rem;
`;











const WarningsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const DeactivateAllButton = styled.button`
  background-color: #FF0000;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: #CC0000;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const WarningsOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
`;

const ConfirmationModal = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 450px;
  width: 90%;
  position: relative;
`;

const ModalTitle = styled.h3`
  color: #005670;
  margin: 0;
  font-size: 1.2rem;
`;

const ModalText = styled.p`
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const CancelButton = styled.button`
  background-color: #ccc;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #999;
  }
`;

const ConfirmButton = styled(DeactivateAllButton)`
  margin: 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const ModalWrapper = styled.div`
  position: fixed;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
`;

const LocationDetail = () => {
  const { t } = useTranslation();
  const { locationId } = useParams();
  const [locationData, setLocationData] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1month');
  const [isLoadingTimeRange, setIsLoadingTimeRange] = useState(false);
  const [lastTimeRange, setLastTimeRange] = useState('1month');
  
  // Convert timeRange to from/to dates for the new API
  const getDateRange = (range) => {
    const now = new Date();
    let from = new Date();
    
    switch (range) {
      case '1day':
        from = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
        break;
      case '1month':
        from = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
        break;
      case '6months':
        from = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000)); // 180 days ago
        break;
      case '1year':
        from = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)); // 365 days ago
        break;
      case '2year':
        from = new Date(now.getTime() - (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years ago
        break;
      default:
        from = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // Default to 1 month
    }
    
    return {
      from: from.toISOString(),
      to: now.toISOString()
    };
  };
  const [thresholds, setThresholds] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [isEntering, setIsEntering] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [visible, setVisible] = useState(false);
  const [optimisticUpdates, setOptimisticUpdates] = useState({
    settings: null,
    thresholds: null
  });
  const [unsavedThresholds, setUnsavedThresholds] = useState(null);
  const [unsavedSettings, setUnsavedSettings] = useState(null);
  const [isDeactivatingAll, setIsDeactivatingAll] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    setIsEntering(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Show loading state for time range changes
        if (environmentalData) {
          setIsLoadingTimeRange(true);
        } else {
          setLoading(true);
        }
        
        const dateRange = getDateRange(timeRange);
        console.log(`Fetching environmental data for timeRange: ${timeRange}`);
        console.log(`Date range: from ${new Date(dateRange.from).toLocaleString()} to ${new Date(dateRange.to).toLocaleString()}`);
        console.log(`ISO strings: from ${dateRange.from} to ${dateRange.to}`);
        
        const [locationResponse, environmentalResponse, warningsResponse] = await Promise.all([
          axiosInstance.get(`/api/data/location/${encodeURIComponent(locationId)}`),
          axiosInstance.get(`/api/data/environmental/${encodeURIComponent(locationId)}`, {
            params: { 
              from: dateRange.from,
              to: dateRange.to
            }
          }),
          axiosInstance.get(`/api/data/warnings/${encodeURIComponent(locationId)}`)
            .catch(error => {
              console.warn('No warnings found:', error);
              return { data: [] }; // Return empty array if warnings endpoint fails
            })
        ]);

        setLocationData(locationResponse.data);
        setEnvironmentalData(environmentalResponse.data);
        setWarnings(warningsResponse.data);
        setThresholds(locationResponse.data.thresholds);
        setSettings(locationResponse.data.settings);
        
        console.log(`Received ${environmentalResponse.data.length} environmental data records from backend`);
        console.log(`Data sample:`, environmentalResponse.data.slice(0, 3));
      } catch (err) {
        setError(err.response?.data?.error || 'Error fetching data');
        console.error('Error fetching location data:', err);
      } finally {
        setLoading(false);
        setIsLoadingTimeRange(false);
      }
    };

    fetchData();
  }, [locationId, timeRange]);

  useEffect(() => {
    // Fade in on mount
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);




  const handleThresholdChange = (sensor, bound, value) => {
    const newValue = parseFloat(value);
    setUnsavedThresholds(prev => ({
      ...prev || thresholds,
      [sensor]: {
        ...(prev || thresholds)[sensor],
        [bound]: newValue
      }
    }));
  };

  const handleSaveThresholds = async () => {
    if (!unsavedThresholds) return;

    try {
      await withRetry(
        async () => {
          const response = await axiosInstance.put(
            `/api/data/location/${locationId}/thresholds`,
            unsavedThresholds  // Send just the thresholds object
          );
          return response;
        },
        3,
        (attempt, max, delay) => {
          console.log(`Retrying threshold update (${attempt}/${max}) in ${delay}ms`);
        }
      );
      setThresholds(unsavedThresholds);
      setUnsavedThresholds(null);
      showSuccess(t('thresholds_updated_successfully_msg'));
    } catch (error) {
      console.error('Failed to update thresholds:', error);
      setError(t('thresholds_update_failed_msg'));
    }
  };

  const handleSettingChange = (setting, value) => {
    const newValue = parseFloat(value);
    setUnsavedSettings(prev => ({
      ...prev || settings,
      [setting]: newValue
    }));
  };

  const handleSaveSettings = async () => {
    if (!unsavedSettings) return;

    try {
      setIsSavingSettings(true);
      await withRetry(
        async () => {
          console.log('Sending settings update:', {
            settings: {
              groundTemperature: parseFloat(unsavedSettings.groundTemperature)
            }
          });
          
          const response = await axiosInstance.put(
            `/api/data/location/${locationId}/settings`,
            {
              settings: {
                groundTemperature: parseFloat(unsavedSettings.groundTemperature)
              }
            }
          );
          return response;
        },
        3,
        (attempt, max, delay) => {
          console.log(`Retrying settings update (${attempt}/${max}) in ${delay}ms`);
        }
      );
      
      setSettings(unsavedSettings);
      setUnsavedSettings(null);
      showSuccess(t('settings_updated_successfully_msg'));
    } catch (error) {
      console.error('Failed to update settings:', error.response?.data || error);
      setError(error.response?.data?.error || t('settings_update_failed_msg'));
    } finally {
      setIsSavingSettings(false);
    }
  };



  const handleDeactivateWarning = async (warningId) => {
    try {
      const userId = localStorage.getItem('userId');
      await axiosInstance.patch(`/api/data/warnings/${warningId}/deactivate`, {
        userId
      });
      setWarnings(warnings.map(warning => 
        warning.id === warningId 
          ? { 
              ...warning, 
              active: false,
              deactivatedBy: userId,
              deactivatedAt: new Date()
          }
          : warning
      ));
    } catch (error) {
      console.error('Error deactivating warning:', error);
    }
  };

  const handleDeactivateAllWarnings = async () => {
    try {
      setIsDeactivatingAll(true);
      const activeWarnings = sortedWarnings.filter(w => w.active);
      const userId = localStorage.getItem('userId');

      // Deactivate each warning sequentially
      for (const warning of activeWarnings) {
        await axiosInstance.patch(`/api/data/warnings/${warning.id}/deactivate`, {
          userId
        });
      }

      // Update local state
      setWarnings(warnings.map(warning => ({
        ...warning,
        active: false,
        deactivatedBy: userId,
        deactivatedAt: new Date().toISOString()
      })));

      showSuccess(t('all_warnings_deactivated_msg'));
    } catch (error) {
      console.error('Error deactivating all warnings:', error);
    } finally {
      setIsDeactivatingAll(false);
      setShowConfirmation(false);
    }
  };

  const sortedWarnings = useMemo(() => {
    //return [...warnings].sort((a, b) => {
    return [...warnings].filter(w => w.active).sort((a, b) => {
      // Sort by active status first (active/red warnings first)
      if (a.active !== b.active) {
        return b.active ? 1 : -1;
      }
      // Then sort by timestamp (newest first)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [warnings]);

  // Process graph data when environmental data changes
  // Backend now handles data manipulation, so we just prepare the data for display
  const processedGraphData = useMemo(() => {
    if (!environmentalData) return null;
    
    return {
      temperature: processGraphData(environmentalData, timeRange, {
        maxDataPoints: environmentalData.length, // Use all data from backend
        enableSmoothing: false, // No smoothing needed since backend handles data quality
        smoothingWindow: 1,
        dataKey: 'temperature'
      }),
      humidity: processGraphData(environmentalData, timeRange, {
        maxDataPoints: environmentalData.length, // Use all data from backend
        enableSmoothing: false, // No smoothing needed since backend handles data quality
        smoothingWindow: 1,
        dataKey: 'relative_humidity'
      }),
      pressure: processGraphData(environmentalData, timeRange, {
        maxDataPoints: environmentalData.length, // Use all data from backend
        enableSmoothing: false, // No smoothing needed since backend handles data quality
        smoothingWindow: 1,
        dataKey: 'air_pressure'
      }),
      combined: processCombinedGraphData(environmentalData, timeRange, {
        maxDataPoints: environmentalData.length, // Use all data from backend
        enableSmoothing: false, // No smoothing needed since backend handles data quality
        smoothingWindow: 1
      })
    };
  }, [environmentalData, timeRange]);

  if (loading || !thresholds || !settings) return <LoadingState message={t('loading_location_data')+"..."} />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <PageContainer $visible={visible}>
      <TopBar locationName={locationData?.name || t('loading')+'...'} />
      <Content>
        <MainSection>
          <Card>
            <Title>{t('environmental_data_title')}</Title>
            <TimeRangeSelector>
              <TimeButton 
                $active={timeRange === '1day'} 
                onClick={() => {
                  if (timeRange !== '1day') {
                    setTimeRange('1day');
                  }
                }}
                disabled={isLoadingTimeRange}
              >
                {t('1_day')}
              </TimeButton>
              <TimeButton 
                $active={timeRange === '1month'} 
                onClick={() => {
                  if (timeRange !== '1month') {
                    setTimeRange('1month');
                  }
                }}
                disabled={isLoadingTimeRange}
              >
                {t('1_month')}
              </TimeButton>
              <TimeButton 
                $active={timeRange === '6months'} 
                onClick={() => {
                  if (timeRange !== '6months') {
                    setTimeRange('6months');
                  }
                }}
                disabled={isLoadingTimeRange}
              >
                {t('6_months')}
              </TimeButton>
              <TimeButton 
                $active={timeRange === '1year'} 
                onClick={() => {
                  if (timeRange !== '1year') {
                    setTimeRange('1year');
                  }
                }}
                disabled={isLoadingTimeRange}
              >
                {t('1_year')}
              </TimeButton>
              <TimeButton 
                $active={timeRange === '2year'} 
                onClick={() => {
                  if (timeRange !== '2year') {
                    setTimeRange('2year');
                  }
                }}
                disabled={isLoadingTimeRange}
              >
                {t('2_years')}
              </TimeButton>
            </TimeRangeSelector>
            
            {isLoadingTimeRange && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                {t('loading_new_data')}...
              </div>
            )}
            
            {!isLoadingTimeRange && environmentalData && (
              <div style={{ textAlign: 'center', padding: '10px', color: '#666', fontSize: '0.9rem' }}>
                Showing data from {new Date(getDateRange(timeRange).from).toLocaleDateString()} to {new Date(getDateRange(timeRange).to).toLocaleDateString()}
              </div>
            )}

            <GraphCard>
              <GraphTitle>{locationData?.name} - {t('combined_data')}</GraphTitle>
              {processedGraphData?.combined && (
                <GraphComponent
                  processedData={processedGraphData.combined.processedData}
                  graphConfig={processedGraphData.combined.graphConfig}
                  groupedData={processedGraphData.combined.groupedData}
                  dataInfo={processedGraphData.combined.dataInfo}
                  dataKey="temperature"
                  unit="°C"
                  thresholds={thresholds.temperature}
                  groundTemp={settings.groundTemperature}
                  locationName={locationData?.name}
                  graphType="combined"
                  height="450px"
                  showSensorLabels={true}
                />
              )}
            </GraphCard>

            <GraphCard>
              <GraphTitle>{locationData?.name} - {t('temperature')} (°C)</GraphTitle>
              {processedGraphData?.temperature && (
                <GraphComponent
                  processedData={processedGraphData.temperature.processedData}
                  graphConfig={processedGraphData.temperature.graphConfig}
                  groupedData={processedGraphData.temperature.groupedData}
                  dataInfo={processedGraphData.temperature.dataInfo}
                  dataKey="temperature"
                  unit="°C"
                  thresholds={thresholds.temperature}
                  groundTemp={settings.groundTemperature}
                  locationName={locationData?.name}
                  graphType="single"
                  height="450px"
                  showSensorLabels={true}
                />
              )}
            </GraphCard>

            <GraphCard>
              <GraphTitle>{locationData?.name} - {t('relative_humidity')} (%)</GraphTitle>
              {processedGraphData?.humidity && (
                <GraphComponent
                  processedData={processedGraphData.humidity.processedData}
                  graphConfig={processedGraphData.humidity.graphConfig}
                  groupedData={processedGraphData.humidity.groupedData}
                  dataInfo={processedGraphData.humidity.dataInfo}
                  dataKey="relative_humidity"
                  unit="%"
                  thresholds={thresholds.humidity}
                  locationName={locationData?.name}
                  graphType="single"
                  height="450px"
                  showSensorLabels={true}
                />
              )}
            </GraphCard>

            <GraphCard>
              <GraphTitle>{locationData?.name} - {t('air_pressure')} (hPa)</GraphTitle>
              {processedGraphData?.pressure && (
                <GraphComponent
                  processedData={processedGraphData.pressure.processedData}
                  graphConfig={processedGraphData.pressure.graphConfig}
                  groupedData={processedGraphData.pressure.groupedData}
                  dataInfo={processedGraphData.pressure.dataInfo}
                  dataKey="air_pressure"
                  unit="hPa"
                  thresholds={thresholds.pressure}
                  locationName={locationData?.name}
                  graphType="single"
                  height="450px"
                  showSensorLabels={true}
                />
              )}
            </GraphCard>
          </Card>

          <Card>
            <WarningsHeader>
              <Title>{t('warnings_for', {locationName: locationData?.name})}</Title>
              {sortedWarnings.filter(w => w.active).length > 1 && (
                <DeactivateAllButton 
                  onClick={() => setShowConfirmation(true)}
                  disabled={isDeactivatingAll}
                >
                  {t('deactivate_all_warnings')}
                </DeactivateAllButton>
              )}
            </WarningsHeader>
            <div style={{ position: 'relative' }}>
              {isDeactivatingAll && (
                <WarningsOverlay>
                  <LoadingState message= {t('deactivating_warnings')+"..."} />
                </WarningsOverlay>
              )}
              {sortedWarnings.length === 0 ? (
                <p>{t('no_warnings')}</p>
              ) : (
                sortedWarnings.map((warning) => (
                  <WarningCard key={warning.id} $active={warning.active}>
                    <WarningHeader>
                      <WarningType $active={warning.active}>{warning.type}</WarningType>
                      <WarningTimestamp>
                        {formatTimestamp(warning.timestamp) } 
                      </WarningTimestamp>
                    </WarningHeader>
                    <WarningMessage>{warning.message}</WarningMessage>
                    {!warning.active && warning.deactivatedBy && (
                      <DeactivationInfo>
                        { t( deactivated_by, {
                          userName: warning.deactivatedBy, 
                          dateTimeDeactivated: formatTimestamp(warning.timestamp) 
                        })}
                      </DeactivationInfo>
                    )}
                    {warning.active && (
                      <DeactivateButton onClick={() => handleDeactivateWarning(warning.id)}>
                        {t('deactivate')}
                      </DeactivateButton>
                    )}
                  </WarningCard>
                ))
              )}
            </div>

            {showConfirmation && (
              <>
                <ModalOverlay onClick={() => setShowConfirmation(false)} />
                <ModalWrapper
                  style={{
                    top: `${window.scrollY + (window.innerHeight / 2)}px`
                  }}
                >
                  <ConfirmationModal>
                    <ModalTitle>{t('deactivate_all_warnings')}</ModalTitle>
                    <ModalText>
                      {t('deactivate_all_warning_msg', {locationName: locationData?.name})}
                    </ModalText>
                    <ModalButtons>
                      <CancelButton onClick={() => setShowConfirmation(false)}>
                        {t('cancel')}
                      </CancelButton>
                      <ConfirmButton onClick={handleDeactivateAllWarnings}>
                        {t('deactivate_all')}
                      </ConfirmButton>
                    </ModalButtons>
                  </ConfirmationModal>
                </ModalWrapper>
              </>
            )}
          </Card>
        </MainSection>

        <SideSection>
          <SettingsCard>
          <Title>{t('settings_for', {locationName: locationData?.name})}</Title>
            <SettingRow>
              <SettingLabel>{t('ground_temperature_title')}:</SettingLabel>
              <SettingInput
                type="number"
                value={(unsavedSettings || settings).groundTemperature}
                onChange={(e) => handleSettingChange('groundTemperature', e.target.value)}
              />
            </SettingRow>
            <SaveButton 
              onClick={handleSaveSettings}
              disabled={isSavingSettings || !unsavedSettings}
            >
              {isSavingSettings ? t('saving')+'...' : t('save_settings')}
            </SaveButton>
          </SettingsCard>

          <Card>
            <Title>{t('thresholds_title')}</Title>
            <ThresholdGroup>
              <SubTitle>{t('temperature')} (°C)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>{t('maximum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).temperature.max}
                  onChange={(e) => handleThresholdChange('temperature', 'max', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>{t('minimum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).temperature.min}
                  onChange={(e) => handleThresholdChange('temperature', 'min', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <ThresholdGroup>
              <SubTitle>{t('relative_humidity')} (%)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>{t('maximum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).humidity.max}
                  onChange={(e) => handleThresholdChange('humidity', 'max', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>{t('minimum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).humidity.min}
                  onChange={(e) => handleThresholdChange('humidity', 'min', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <ThresholdGroup>
              <SubTitle>{t('air_pressure')} (hPa)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>{t('maximum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).pressure.max}
                  onChange={(e) => handleThresholdChange('pressure', 'max', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>{t('minimum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).pressure.min}
                  onChange={(e) => handleThresholdChange('pressure', 'min', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <SaveButton 
              onClick={handleSaveThresholds}
              disabled={!unsavedThresholds}
            >
              {t('save_thresholds')}
            </SaveButton>
          </Card>
        </SideSection>
      </Content>
    </PageContainer>
  );
};

export default LocationDetail; 