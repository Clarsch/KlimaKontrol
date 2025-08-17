import React from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { formatTimestamp } from '../utils/graphDataProcessor';
import GraphErrorBoundary from './GraphErrorBoundary';

const GraphContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.height || '450px'};
  min-height: 450px;
  display: flex;
  flex-direction: column;
`;

const GraphChartContainer = styled.div`
  flex: 1;
  min-height: 350px;
  height: 350px;
  position: relative;
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

const DataInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  font-size: 10px;
  color: #999;
  font-style: italic;
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

const GraphComponent = ({ 
  processedData,
  graphConfig,
  groupedData,
  dataInfo,
  dataKey, 
  unit, 
  thresholds, 
  groundTemp = null, 
  locationName,
  graphType = 'single',
  height = '450px',
  showSensorLabels = true
}) => {
  // Handle empty data
  if (!processedData || processedData.length === 0) {
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

  // Format data for Recharts (convert timestamps to numbers)
  const formattedData = processedData.map(point => ({
    ...point,
    record_time: new Date(point.record_time).getTime()
  }));

  const renderSingleGraph = () => (
    <>
      <GraphChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={processedData}
            margin={{ top: 20, right: 80, bottom: 50, left: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="record_time"
              type="number"
              domain={[graphConfig.xAxis.start, graphConfig.xAxis.end]}
              tickFormatter={(timestamp) => formatTimestamp(timestamp, graphConfig.xAxis.tickFormat)}
              ticks={graphConfig.xAxis.ticks}
              minTickGap={30}
              axisLine={{ stroke: '#666', strokeWidth: 1 }}
              tickLine={{ stroke: '#666', strokeWidth: 1 }}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis 
              domain={[graphConfig.yAxis.min, graphConfig.yAxis.max]}
              ticks={graphConfig.yAxis.ticks}
              allowDecimals={true}
              axisLine={{ stroke: '#666', strokeWidth: 1 }}
              tickLine={{ stroke: '#666', strokeWidth: 1 }}
              tick={{ fontSize: 12, fill: '#666' }}
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
            {Object.entries(groupedData).map(([key, records], index) => {
              const [sensorId] = key.split('|');
              const color = graphConfig.colors[index % graphConfig.colors.length];
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={`sensor_${sensorId}`}
                  data={processedData}
                  stroke={color}
                  dot={false}
                  strokeWidth={2}
                  name={`Sensor ${sensorId}`}
                  connectNulls={true}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </GraphChartContainer>
      
      {/* Sensor labels */}
      {showSensorLabels && (
        <>
          <SensorLabel>
            {Object.entries(groupedData).map(([key], index) => {
              const [sensorId] = key.split('|');
              const color = graphConfig.colors[index % graphConfig.colors.length];
              return (
                <SensorLabelItem key={key}>
                  <SensorColorDot $color={color} />
                  <span>Sensor {sensorId}</span>
                </SensorLabelItem>
              );
            })}
          </SensorLabel>
          {dataInfo.totalPoints > dataInfo.processedPoints && (
            <DataInfo>
              Showing {dataInfo.processedPoints} of {dataInfo.totalPoints} data points for better visualization
            </DataInfo>
          )}
          {dataInfo.timeSpan > 0 && (
            <DataInfo>
              Data available for {dataInfo.timeSpan.toFixed(1)} days
            </DataInfo>
          )}
        </>
      )}
    </>
  );

  const renderCombinedGraph = () => (
    <>
      <GraphChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={processedData}
            margin={{ top: 20, right: 80, bottom: 50, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="record_time"
              type="number"
              domain={[graphConfig.xAxis.start, graphConfig.xAxis.end]}
              tickFormatter={(timestamp) => formatTimestamp(timestamp, graphConfig.xAxis.tickFormat)}
              ticks={graphConfig.xAxis.ticks}
              minTickGap={30}
              axisLine={{ stroke: '#666', strokeWidth: 1 }}
              tickLine={{ stroke: '#666', strokeWidth: 1 }}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis 
              yAxisId="temp" 
              orientation="left" 
              axisLine={{ stroke: '#666', strokeWidth: 1 }}
              tickLine={{ stroke: '#666', strokeWidth: 1 }}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis 
              yAxisId="humidity" 
              orientation="right" 
              axisLine={{ stroke: '#666', strokeWidth: 1 }}
              tickLine={{ stroke: '#666', strokeWidth: 1 }}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis yAxisId="pressure" orientation="right" domain={[970, 1050]} hide />
            <Tooltip
              content={(props) => (
                <CustomTooltipContent {...props} locationName={locationName} />
              )}
            />
            {/* Render a Line for each sensor_id|location_id group */}
            {Object.entries(groupedData).map(([key, records], index) => {
              const [sensorId] = key.split('|');
              const color = graphConfig.colors[index % graphConfig.colors.length];
              return (
                <Line
                  key={key}
                  yAxisId="temp"
                  type="monotone"
                  dataKey={`sensor_${sensorId}`}
                  data={processedData}
                  stroke={color}
                  dot={false}
                  strokeWidth={2}
                  name={`Sensor ${sensorId}`}
                  connectNulls={true}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </GraphChartContainer>
      
      {/* Sensor labels */}
      {showSensorLabels && (
        <>
          <SensorLabel>
            {Object.entries(groupedData).map(([key], index) => {
              const [sensorId] = key.split('|');
              const color = graphConfig.colors[index % graphConfig.colors.length];
              return (
                <SensorLabelItem key={key}>
                  <SensorColorDot $color={color} />
                  <span>Sensor {sensorId}</span>
                </SensorLabelItem>
              );
            })}
          </SensorLabel>
          {dataInfo.totalPoints > dataInfo.processedPoints && (
            <DataInfo>
              Showing {dataInfo.processedPoints} of {dataInfo.totalPoints} data points for better visualization
            </DataInfo>
          )}
          {dataInfo.timeSpan > 0 && (
            <DataInfo>
              Data available for {dataInfo.timeSpan.toFixed(1)} days
            </DataInfo>
          )}
        </>
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