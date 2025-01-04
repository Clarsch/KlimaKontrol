import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import TopBar from '../components/TopBar';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, subMonths, subDays, subYears, startOfDay, endOfDay } from 'date-fns';
import { withRetry, withOptimisticUpdate } from '../utils/apiHelpers';
import { showSuccess } from '../components/SuccessMessage';
import PropTypes from 'prop-types';
import GraphErrorBoundary from '../components/GraphErrorBoundary';
import axiosInstance from '../api/axiosConfig';

const PageContainer = styled.div`
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
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
`;

const MainSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SideSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const SubTitle = styled.h3`
  color: #005670;
  margin-bottom: 1rem;
  font-size: 1.2rem;
`;

const ThresholdGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const ThresholdRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const ThresholdLabel = styled.span`
  color: #005670;
  min-width: 120px;
`;

const ThresholdInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100px;
`;

const SaveButton = styled.button`
  background-color: #005670;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;

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
`;

const GraphCard = styled(Card)`
  height: 330px;
  margin-bottom: 1rem;
  padding: 1rem 0.5rem 2.5rem 0.5rem;
  overflow: visible;
`;

const GraphTitle = styled.h4`
  color: #005670;
  margin-bottom: 1rem;
  font-size: 1rem;
`;

const SettingsCard = styled(Card)`
  margin-bottom: 2rem;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const SettingLabel = styled.span`
  color: #005670;
  min-width: 150px;
`;

const SettingInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100px;
`;

const DeactivationInfo = styled.div`
  color: #666;
  font-size: 0.9em;
  font-style: italic;
  margin-top: 0.5rem;
`;

const CustomTooltip = styled.div`
  background-color: white;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .date-time {
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
    margin-bottom: 5px;
    font-weight: bold;
    color: #666;
  }

  .measurement {
    color: #333;
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
`;

const CustomTooltipContent = ({ active, payload, label, locationName, unit }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <CustomTooltip>
      <div className="date-time">
        {locationName} - {format(new Date(label), 'MMM d, yyyy HH:mm')}
      </div>
      {payload.map((entry, index) => {
        const value = parseFloat(entry.value);
        if (isNaN(value)) return null;

        const valueUnit = entry.name === 'temperature' ? '°C' : 
                         entry.name === 'relative_humidity' ? '%' : 
                         entry.name === 'air_pressure' ? 'hPa' : '';

        const displayName = entry.name.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return (
          <div key={index} className="measurement">
            <span>{displayName}:</span>
            <span>{value.toFixed(1)} {valueUnit}</span>
          </div>
        );
      })}
    </CustomTooltip>
  );
};

CustomTooltipContent.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  })),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  locationName: PropTypes.string,
  unit: PropTypes.string
};

const getTimeRange = (range) => {
  const now = new Date();
  switch (range) {
    case '1day':
      return {
        start: startOfDay(now).getTime(),
        end: endOfDay(now).getTime(),
        tickFormat: 'HH:mm',
        ticks: 24 // Show hourly ticks
      };
    case '1month':
      return {
        start: subMonths(now, 1).getTime(),
        end: now.getTime(),
        tickFormat: 'MMM dd',
        ticks: 30 // Show daily ticks
      };
    case '6months':
      return {
        start: subMonths(now, 6).getTime(),
        end: now.getTime(),
        tickFormat: 'MMM dd',
        ticks: 12 // Show bi-weekly ticks
      };
    case '1year':
      return {
        start: subYears(now, 1).getTime(),
        end: now.getTime(),
        tickFormat: 'MMM yyyy',
        ticks: 12 // Show monthly ticks
      };
    case '2year':
      return {
        start: subYears(now, 2).getTime(),
        end: now.getTime(),
        tickFormat: 'MMM yyyy',
        ticks: 12 // Show monthly ticks
      };
    default:
      return null;
  }
};

const DetailContainer = styled.div`
  opacity: ${props => props.fadeIn ? '1' : '0'};
  transition: opacity 0.3s ease;
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
  const { locationId } = useParams();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1month');
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
        setLoading(true);
        const [locationResponse, environmentalResponse, warningsResponse] = await Promise.all([
          axiosInstance.get(`/api/data/location/${encodeURIComponent(locationId)}`),
          axiosInstance.get(`/api/data/environmental/${encodeURIComponent(locationId)}`, {
            params: { timeRange }
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
      } catch (err) {
        setError(err.response?.data?.error || 'Error fetching data');
        console.error('Error fetching location data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationId, timeRange]);

  useEffect(() => {
    // Fade in on mount
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderGraph = (data, dataKey, unit, color, thresholds, groundTemp = null) => {
    const timeRangeConfig = getTimeRange(timeRange);
    
    const formattedData = data.map(point => ({
      ...point,
      record_time: new Date(point.record_time).getTime()
    }));

    const dataMin = Math.min(...formattedData.map(d => parseFloat(d[dataKey])));
    const dataMax = Math.max(...formattedData.map(d => parseFloat(d[dataKey])));
    
    const yMin = Math.min(thresholds.min, dataMin);
    const yMax = Math.max(thresholds.max, dataMax);
    
    const domainPadding = (yMax - yMin) * 0.05;

    // Calculate Y-axis ticks
    const yAxisTicks = [];
    const tickCount = 5;
    const tickInterval = (yMax - yMin) / (tickCount - 1);
    for (let i = 0; i < tickCount; i++) {
      yAxisTicks.push(Math.round((yMin + (i * tickInterval)) * 10) / 10);
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={formattedData} 
          margin={{ top: 5, right: 60, bottom: 25, left: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3"
            horizontal={true}
            vertical={true}
          />
          <XAxis 
            dataKey="record_time"
            type="number"
            domain={[timeRangeConfig.start, timeRangeConfig.end]}
            tickFormatter={(timestamp) => format(timestamp, timeRangeConfig.tickFormat)}
            scale="time"
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[
              Math.floor(yMin - domainPadding), 
              Math.ceil(yMax + domainPadding)
            ]}
            ticks={yAxisTicks}
            allowDecimals={true}
            interval="preserveStartEnd"
          />
          <Tooltip 
            content={(props) => (
              <CustomTooltipContent 
                {...props} 
                locationName={locationData?.name}
                unit={unit}
              />
            )}
          />
          
          {/* Threshold lines */}
          <ReferenceLine 
            y={thresholds.max} 
            stroke="#FFA500" 
            strokeDasharray="3 3"
            label={{ 
              value: `${thresholds.max}${unit}`,
              position: 'right',
              fill: '#FFA500'
            }}
          />
          <ReferenceLine 
            y={thresholds.min} 
            stroke="#FFA500" 
            strokeDasharray="3 3"
            label={{ 
              value: `${thresholds.min}${unit}`,
              position: 'right',
              fill: '#FFA500'
            }}
          />

          {/* Ground temperature reference line (only for temperature graph) */}
          {groundTemp !== null && (
            <ReferenceLine 
              y={groundTemp} 
              stroke="#005670" 
              strokeDasharray="3 3"
              label={{ 
                value: `${groundTemp}°C`,
                position: 'right',
                fill: '#005670'
              }}
            />
          )}

          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

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
      showSuccess('Thresholds updated successfully');
    } catch (error) {
      console.error('Failed to update thresholds:', error);
      setError('Failed to update thresholds');
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
      showSuccess('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const renderCombinedGraph = (data, thresholds, groundTemp) => {
    const timeRangeConfig = getTimeRange(timeRange);
    
    const formattedData = data.map(point => ({
      ...point,
      record_time: new Date(point.record_time).getTime()
    }));

    const tempMin = Math.min(...formattedData.map(d => parseFloat(d.temperature)));
    const tempMax = Math.max(...formattedData.map(d => parseFloat(d.temperature)));
    const humidityMin = Math.min(...formattedData.map(d => parseFloat(d.relative_humidity)));
    const humidityMax = Math.max(...formattedData.map(d => parseFloat(d.relative_humidity)));
    
    const tempPadding = (Math.max(tempMax, thresholds.temperature.max) - 
                        Math.min(tempMin, thresholds.temperature.min)) * 0.05;
    const humidityPadding = (Math.max(humidityMax, thresholds.humidity.max) - 
                            Math.min(humidityMin, thresholds.humidity.min)) * 0.05;

    // Calculate ticks for both axes
    const tempTicks = [];
    const humidityTicks = [];
    const tickCount = 5;

    const tempInterval = (tempMax - tempMin) / (tickCount - 1);
    const humidityInterval = (humidityMax - humidityMin) / (tickCount - 1);

    for (let i = 0; i < tickCount; i++) {
      tempTicks.push(Math.round((tempMin + (i * tempInterval)) * 10) / 10);
      humidityTicks.push(Math.round((humidityMin + (i * humidityInterval)) * 10) / 10);
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={formattedData} 
          margin={{ top: 5, right: 60, bottom: 25, left: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3"
            horizontal={true}
            vertical={true}
          />
          <XAxis 
            dataKey="record_time"
            type="number"
            domain={[timeRangeConfig.start, timeRangeConfig.end]}
            tickFormatter={(timestamp) => format(timestamp, timeRangeConfig.tickFormat)}
            scale="time"
            interval="preserveStartEnd"
          />
          <YAxis 
            yAxisId="temp" 
            domain={[
              Math.floor(Math.min(tempMin, thresholds.temperature.min) - tempPadding),
              Math.ceil(Math.max(tempMax, thresholds.temperature.max) + tempPadding)
            ]}
            ticks={tempTicks}
            orientation="left"
            interval="preserveStartEnd"
          />
          <YAxis 
            yAxisId="humidity" 
            domain={[
              Math.floor(Math.min(humidityMin, thresholds.humidity.min) - humidityPadding),
              Math.ceil(Math.max(humidityMax, thresholds.humidity.max) + humidityPadding)
            ]}
            ticks={humidityTicks}
            orientation="right"
            interval="preserveStartEnd"
          />
          <YAxis 
            yAxisId="pressure" 
            orientation="right" 
            domain={[970, 1050]}
            hide // Hide the axis but keep it for the line
          />
          
          <Tooltip 
            content={(props) => (
              <CustomTooltipContent 
                {...props} 
                locationName={locationData?.name}
              />
            )}
          />

          {/* Ground temperature reference line */}
          <ReferenceLine 
            yAxisId="temp"
            y={groundTemp} 
            stroke="#005670" 
            strokeDasharray="3 3"
            label={{ 
              value: `${groundTemp}°C`,
              position: 'right',
              fill: '#005670'
            }}
          />

          <Line 
            yAxisId="temp"
            type="monotone" 
            dataKey="temperature" 
            stroke="#FF6B6B" 
            dot={false}
            strokeWidth={2}
            name="temperature"
          />
          <Line 
            yAxisId="humidity"
            type="monotone" 
            dataKey="relative_humidity" 
            stroke="#4ECDC4" 
            dot={false}
            strokeWidth={2}
            name="relative_humidity"
          />
          <Line 
            yAxisId="pressure"
            type="monotone" 
            dataKey="air_pressure" 
            stroke="#45B7D1" 
            dot={false}
            strokeWidth={2}
            name="air_pressure"
          />
        </LineChart>
      </ResponsiveContainer>
    );
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

      showSuccess('All warnings have been deactivated');
    } catch (error) {
      console.error('Error deactivating all warnings:', error);
    } finally {
      setIsDeactivatingAll(false);
      setShowConfirmation(false);
    }
  };

  const sortedWarnings = useMemo(() => {
    return [...warnings].sort((a, b) => {
      // Sort by active status first (active/red warnings first)
      if (a.active !== b.active) {
        return b.active ? 1 : -1;
      }
      // Then sort by timestamp (newest first)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [warnings]);

  if (loading || !thresholds || !settings) return <LoadingState message="Loading location data..." />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <PageContainer $visible={visible}>
      <TopBar locationName={locationData?.name || 'Loading...'} />
      <Content>
        <MainSection>
          <Card>
            <Title>Environmental Data</Title>
            <TimeRangeSelector>
              <TimeButton 
                $active={timeRange === '1day'} 
                onClick={() => setTimeRange('1day')}
              >
                1 Day
              </TimeButton>
              <TimeButton 
                $active={timeRange === '1month'} 
                onClick={() => setTimeRange('1month')}
              >
                1 Month
              </TimeButton>
              <TimeButton 
                $active={timeRange === '6months'} 
                onClick={() => setTimeRange('6months')}
              >
                6 Months
              </TimeButton>
              <TimeButton 
                $active={timeRange === '1year'} 
                onClick={() => setTimeRange('1year')}
              >
                1 Year
              </TimeButton>
              <TimeButton 
                $active={timeRange === '2year'} 
                onClick={() => setTimeRange('2year')}
              >
                2 Year
              </TimeButton>
            </TimeRangeSelector>

            <GraphCard>
              <GraphTitle>{locationData?.name} - Combined Data</GraphTitle>
              <GraphErrorBoundary>
                {environmentalData && renderCombinedGraph(
                  environmentalData,
                  thresholds,
                  settings.groundTemperature
                )}
              </GraphErrorBoundary>
            </GraphCard>

            <GraphCard>
              <GraphTitle>{locationData?.name} - Temperature (°C)</GraphTitle>
              {environmentalData && renderGraph(
                environmentalData,
                'temperature',
                '°C',
                '#FF6B6B',
                thresholds.temperature,
                settings.groundTemperature
              )}
            </GraphCard>

            <GraphCard>
              <GraphTitle>{locationData?.name} - Relative Humidity (%)</GraphTitle>
              {environmentalData && renderGraph(
                environmentalData,
                'relative_humidity',
                '%',
                '#4ECDC4',
                thresholds.humidity
              )}
            </GraphCard>

            <GraphCard>
              <GraphTitle>{locationData?.name} - Air Pressure (hPa)</GraphTitle>
              {environmentalData && renderGraph(
                environmentalData,
                'air_pressure',
                'hPa',
                '#45B7D1',
                thresholds.pressure
              )}
            </GraphCard>
          </Card>

          <Card>
            <WarningsHeader>
              <Title>Warnings for {locationData?.name}</Title>
              {sortedWarnings.filter(w => w.active).length > 1 && (
                <DeactivateAllButton 
                  onClick={() => setShowConfirmation(true)}
                  disabled={isDeactivatingAll}
                >
                  Deactivate All Warnings
                </DeactivateAllButton>
              )}
            </WarningsHeader>
            <div style={{ position: 'relative' }}>
              {isDeactivatingAll && (
                <WarningsOverlay>
                  <LoadingState message="Deactivating warnings..." />
                </WarningsOverlay>
              )}
              {sortedWarnings.length === 0 ? (
                <p>No warnings</p>
              ) : (
                sortedWarnings.map((warning) => (
                  <WarningCard key={warning.id} $active={warning.active}>
                    <WarningHeader>
                      <WarningType $active={warning.active}>{warning.type}</WarningType>
                      <WarningTimestamp>
                        {format(new Date(warning.timestamp), 'MMM d, yyyy HH:mm')}
                      </WarningTimestamp>
                    </WarningHeader>
                    <WarningMessage>{warning.message}</WarningMessage>
                    {!warning.active && warning.deactivatedBy && (
                      <DeactivationInfo>
                        Deactivated by {warning.deactivatedBy} at {
                          format(new Date(warning.deactivatedAt), 'MMM d, yyyy HH:mm')
                        }
                      </DeactivationInfo>
                    )}
                    {warning.active && (
                      <DeactivateButton onClick={() => handleDeactivateWarning(warning.id)}>
                        Deactivate
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
                    <ModalTitle>Deactivate All Warnings</ModalTitle>
                    <ModalText>
                      You are about to deactivate all active warnings for {locationData?.name}. 
                      This action cannot be undone. Please confirm!
                    </ModalText>
                    <ModalButtons>
                      <CancelButton onClick={() => setShowConfirmation(false)}>
                        Cancel
                      </CancelButton>
                      <ConfirmButton onClick={handleDeactivateAllWarnings}>
                        Deactivate All
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
            <Title>Settings for {locationData?.name}</Title>
            <SettingRow>
              <SettingLabel>Ground Temperature:</SettingLabel>
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
              {isSavingSettings ? 'Saving...' : 'Save Settings'}
            </SaveButton>
          </SettingsCard>

          <Card>
            <Title>Thresholds</Title>
            <ThresholdGroup>
              <SubTitle>Temperature (°C)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>Maximum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).temperature.max}
                  onChange={(e) => handleThresholdChange('temperature', 'max', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>Minimum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).temperature.min}
                  onChange={(e) => handleThresholdChange('temperature', 'min', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <ThresholdGroup>
              <SubTitle>Humidity (%)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>Maximum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).humidity.max}
                  onChange={(e) => handleThresholdChange('humidity', 'max', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>Minimum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).humidity.min}
                  onChange={(e) => handleThresholdChange('humidity', 'min', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <ThresholdGroup>
              <SubTitle>Air Pressure (hPa)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>Maximum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).pressure.max}
                  onChange={(e) => handleThresholdChange('pressure', 'max', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>Minimum:</ThresholdLabel>
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
              Save Thresholds
            </SaveButton>
          </Card>
        </SideSection>
      </Content>
    </PageContainer>
  );
};

export default LocationDetail; 