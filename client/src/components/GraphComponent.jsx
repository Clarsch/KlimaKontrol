import React from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { groupReadingsBySensorAndLocation } from '../utils/dataProcessor';
import GraphErrorBoundary from './GraphErrorBoundary';

const GraphContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const SensorLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
`;

const SensorLabelItem = styled.div`
  display: flex;
  align-items: center;
  margin: 0 8px;
`;

const SensorColorDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$color};
  margin-right: 4px;
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

const getTimeRange = (range) => {
  const now = new Date();
  const end = now.getTime();
  
  switch (range) {
    case '1day':
      return {
        start: now.setDate(now.getDate() - 1),
        end,
        tickFormat: 'HH:mm'
      };
    case '1week':
      return {
        start: now.setDate(now.getDate() - 7),
        end,
        tickFormat: 'MMM d'
      };
    case '1month':
      return {
        start: now.setMonth(now.getMonth() - 1),
        end,
        tickFormat: 'MMM d'
      };
    case '1year':
      return {
        start: now.setFullYear(now.getFullYear() - 1),
        end,
        tickFormat: 'MMM yyyy'
      };
    case '2year':
      return {
        start: now.setFullYear(now.getFullYear() - 2),
        end,
        tickFormat: 'MMM yyyy'
      };
    default:
      return {
        start: now.setDate(now.getDate() - 7),
        end,
        tickFormat: 'MMM d'
      };
  }
};

const GraphComponent = ({ 
  data, 
  dataKey, 
  unit, 
  thresholds, 
  groundTemp = null, 
  timeRange = '1week',
  locationName,
  graphType = 'single', // 'single' or 'combined'
  height = '330px',
  showSensorLabels = true
}) => {
  // Handle null, undefined, or empty data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <GraphContainer style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p>No data available</p>
          </div>
        </ResponsiveContainer>
      </GraphContainer>
    );
  }

  const timeRangeConfig = getTimeRange(timeRange);
  const grouped = groupReadingsBySensorAndLocation(data);
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA500', '#005670'];
  let colorIdx = 0;

  // Calculate overall data range for Y-axis
  const allData = Object.values(grouped).flat();
  const formattedData = allData.map(point => ({
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

  const renderSingleGraph = () => (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
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
                locationName={locationName}
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

          {/* Render a Line for each sensor_id|location_id group */}
          {Object.entries(grouped).map(([key, records]) => {
            const [sensorId] = key.split('|');
            const color = colors[colorIdx++ % colors.length];
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={dataKey}
                data={records.map(point => ({ ...point, record_time: new Date(point.record_time).getTime() }))}
                stroke={color}
                dot={false}
                strokeWidth={2}
                name={`Sensor ${sensorId}`}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Sensor labels */}
      {showSensorLabels && (
        <SensorLabel>
          {Object.entries(grouped).map(([key], index) => {
            const [sensorId] = key.split('|');
            const color = colors[index % colors.length];
            return (
              <SensorLabelItem key={key}>
                <SensorColorDot $color={color} />
                <span>Sensor {sensorId}</span>
              </SensorLabelItem>
            );
          })}
        </SensorLabel>
      )}
    </>
  );

  const renderCombinedGraph = () => (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart margin={{ top: 5, right: 60, bottom: 25, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal vertical />
          <XAxis
            dataKey="record_time"
            type="number"
            domain={[timeRangeConfig.start, timeRangeConfig.end]}
            tickFormatter={(timestamp) => format(timestamp, timeRangeConfig.tickFormat)}
            scale="time"
            interval="preserveStartEnd"
          />
          <YAxis yAxisId="temp" orientation="left" />
          <YAxis yAxisId="humidity" orientation="right" />
          <YAxis yAxisId="pressure" orientation="right" domain={[970, 1050]} hide />
          <Tooltip
            content={(props) => (
              <CustomTooltipContent {...props} locationName={locationName} />
            )}
          />
          {/* Render a Line for each sensor_id|location_id group */}
          {Object.entries(grouped).map(([key, records]) => {
            const [sensorId] = key.split('|');
            const color = colors[colorIdx++ % colors.length];
            return (
              <Line
                key={key}
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                data={records.map(point => ({ ...point, record_time: new Date(point.record_time).getTime() }))}
                stroke={color}
                dot={false}
                strokeWidth={2}
                name={`Sensor ${sensorId}`}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Sensor labels */}
      {showSensorLabels && (
        <SensorLabel>
          {Object.entries(grouped).map(([key], index) => {
            const [sensorId] = key.split('|');
            const color = colors[index % colors.length];
            return (
              <SensorLabelItem key={key}>
                <SensorColorDot $color={color} />
                <span>Sensor {sensorId}</span>
              </SensorLabelItem>
            );
          })}
        </SensorLabel>
      )}
    </>
  );

  return (
    <GraphContainer style={{ height }}>
      <GraphErrorBoundary>
        {graphType === 'combined' ? renderCombinedGraph() : renderSingleGraph()}
      </GraphErrorBoundary>
    </GraphContainer>
  );
};

export default GraphComponent; 