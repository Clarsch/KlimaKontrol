import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import TopBar from '../components/TopBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, subMonths, subDays, subYears, startOfDay, endOfDay } from 'date-fns';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 80px;
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
  height: 300px;
  margin-bottom: 1rem;
  padding-bottom: 2.5rem;
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

const BackButton = styled.button`
  position: fixed;
  top: 100px;
  left: 2rem;
  background: none;
  border: none;
  color: #005670;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 5;
  display: flex;
  align-items: center;
  line-height: 1;

  &:hover {
    color: #004560;
  }

  &::before {
    content: '←';
  }
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

const CustomTooltipContent = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <CustomTooltip>
      <div className="date-time">
        {format(label, 'MMM d, yyyy HH:mm')}
      </div>
      {payload.map((entry, index) => (
        <div key={index} className="measurement">
          <span>{entry.name}:</span>
          <span>{entry.value} {entry.unit}</span>
        </div>
      ))}
    </CustomTooltip>
  );
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
    default:
      return null;
  }
};

const LocationDetail = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1month');
  const [thresholds, setThresholds] = useState({
    temperature: { min: -20, max: 30 },
    humidity: { min: 30, max: 70 },
    pressure: { min: 980, max: 1030 }
  });
  const [settings, setSettings] = useState({ groundTemperature: 15 });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [locationResponse, environmentalResponse, warningsResponse] = await Promise.all([
          axios.get(`http://localhost:5001/api/data/location/${encodeURIComponent(locationId)}`),
          axios.get(`http://localhost:5001/api/data/environmental/${encodeURIComponent(locationId)}`, {
            params: { timeRange }
          }),
          axios.get(`http://localhost:5001/api/data/warnings/${encodeURIComponent(locationId)}`)
        ]);

        setLocationData(locationResponse.data);
        setEnvironmentalData(environmentalResponse.data);
        setWarnings(warningsResponse.data);
        setSettings(locationResponse.data.settings || { groundTemperature: 15 });
      } catch (err) {
        setError('Error fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationId, timeRange]);

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

    const tickStep = (timeRangeConfig.end - timeRangeConfig.start) / (timeRangeConfig.ticks - 1);
    const ticks = Array.from({ length: timeRangeConfig.ticks }, (_, i) => 
      timeRangeConfig.start + (tickStep * i)
    );

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={formattedData} 
          margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="record_time"
            type="number"
            domain={[timeRangeConfig.start, timeRangeConfig.end]}
            tickFormatter={(timestamp) => format(timestamp, timeRangeConfig.tickFormat)}
            ticks={ticks}
            scale="time"
          />
          <YAxis domain={[thresholds.min, thresholds.max]} />
          <Tooltip 
            content={<CustomTooltipContent />}
            payload={[{ unit }]}
          />
          
          {/* Threshold lines */}
          <ReferenceLine 
            y={thresholds.max} 
            stroke="#FFA500" 
            strokeDasharray="3 3"
            label={{ 
              value: `Max: ${thresholds.max}${unit}`,
              position: 'right',
              fill: '#FFA500'
            }}
          />
          <ReferenceLine 
            y={thresholds.min} 
            stroke="#FFA500" 
            strokeDasharray="3 3"
            label={{ 
              value: `Min: ${thresholds.min}${unit}`,
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
                value: `Ground Temp: ${groundTemp}°C`,
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
    setThresholds(prev => ({
      ...prev,
      [sensor]: {
        ...prev[sensor],
        [bound]: parseFloat(value)
      }
    }));
  };

  const handleSaveThresholds = async () => {
    try {
      await axios.put(`http://localhost:5001/api/locations/${locationId}/thresholds`, thresholds);
      // Show success message or update UI
    } catch (error) {
      // Handle error
    }
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: parseInt(value, 10)
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true);
      await axios.put(`http://localhost:5001/api/data/location/${locationId}/settings`, {
        settings
      });
      // Show success message or update UI
    } catch (error) {
      // Handle error
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

    const tickStep = (timeRangeConfig.end - timeRangeConfig.start) / (timeRangeConfig.ticks - 1);
    const ticks = Array.from({ length: timeRangeConfig.ticks }, (_, i) => 
      timeRangeConfig.start + (tickStep * i)
    );

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={formattedData} 
          margin={{ top: 5, right: 30, bottom: 25, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="record_time"
            type="number"
            domain={[timeRangeConfig.start, timeRangeConfig.end]}
            tickFormatter={(timestamp) => format(timestamp, timeRangeConfig.tickFormat)}
            ticks={ticks}
            scale="time"
          />
          <YAxis 
            yAxisId="temp" 
            domain={[thresholds.temperature.min, thresholds.temperature.max]}
            orientation="left"
          />
          <YAxis 
            yAxisId="humidity" 
            orientation="right" 
            domain={[thresholds.humidity.min, thresholds.humidity.max]}
          />
          <YAxis 
            yAxisId="pressure" 
            orientation="right" 
            domain={[970, 1050]}
            hide // Hide the axis but keep it for the line
          />
          
          <Tooltip 
            content={<CustomTooltipContent />}
            payload={[
              { unit: '°C' },
              { unit: '%' },
              { unit: 'hPa' }
            ]}
          />

          {/* Ground temperature reference line */}
          <ReferenceLine 
            yAxisId="temp"
            y={groundTemp} 
            stroke="#005670" 
            strokeDasharray="3 3"
            label={{ 
              value: `Ground Temp: ${groundTemp}°C`,
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

  const handleBack = () => {
    // Navigate back while preserving the dashboard state
    navigate('/dashboard', { 
      state: { 
        preserveState: true 
      }
    });
  };

  const handleDeactivateWarning = async (warningId) => {
    try {
      const userId = localStorage.getItem('userId'); // Or however you store the current user's ID
      await axios.patch(`http://localhost:5001/api/data/warnings/${warningId}/deactivate`, {
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <PageContainer>
      <TopBar locationName={locationId} />
      <BackButton onClick={handleBack} />
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
            </TimeRangeSelector>

            <GraphCard>
              <GraphTitle>Combined Temperature and Humidity</GraphTitle>
              {environmentalData && renderCombinedGraph(
                environmentalData,
                thresholds,
                settings.groundTemperature
              )}
            </GraphCard>

            <GraphCard>
              <GraphTitle>Temperature (°C)</GraphTitle>
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
              <GraphTitle>Relative Humidity (%)</GraphTitle>
              {environmentalData && renderGraph(
                environmentalData,
                'relative_humidity',
                '%',
                '#4ECDC4',
                thresholds.humidity
              )}
            </GraphCard>

            <GraphCard>
              <GraphTitle>Air Pressure (hPa)</GraphTitle>
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
            <Title>Warnings</Title>
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
          </Card>
        </MainSection>

        <SideSection>
          <SettingsCard>
            <Title>Location Settings</Title>
            <SettingRow>
              <SettingLabel>Grund Temperatur:</SettingLabel>
              <SettingInput
                type="number"
                value={settings.groundTemperature}
                onChange={(e) => handleSettingChange('groundTemperature', e.target.value)}
              />
            </SettingRow>
            <SaveButton 
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
            >
              {isSavingSettings ? 'Saving...' : 'Save Settings'}
            </SaveButton>
          </SettingsCard>

          <Card>
            <Title>Thresholds</Title>
            <ThresholdGroup>
              <SubTitle>Temperature (°C)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>Minimum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={thresholds.temperature.min}
                  onChange={(e) => handleThresholdChange('temperature', 'min', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>Maximum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={thresholds.temperature.max}
                  onChange={(e) => handleThresholdChange('temperature', 'max', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <ThresholdGroup>
              <SubTitle>Humidity (%)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>Minimum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={thresholds.humidity.min}
                  onChange={(e) => handleThresholdChange('humidity', 'min', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>Maximum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={thresholds.humidity.max}
                  onChange={(e) => handleThresholdChange('humidity', 'max', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <ThresholdGroup>
              <SubTitle>Air Pressure (hPa)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>Minimum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={thresholds.pressure.min}
                  onChange={(e) => handleThresholdChange('pressure', 'min', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>Maximum:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={thresholds.pressure.max}
                  onChange={(e) => handleThresholdChange('pressure', 'max', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <SaveButton onClick={handleSaveThresholds}>
              Save Thresholds
            </SaveButton>
          </Card>
        </SideSection>
      </Content>
    </PageContainer>
  );
};

export default LocationDetail; 