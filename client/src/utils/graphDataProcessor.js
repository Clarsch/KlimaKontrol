import { format } from 'date-fns';
import { groupReadingsBySensorAndLocation } from './dataProcessor';

/**
 * Processes raw environmental data for graph display
 * @param {Array} rawData - Raw environmental data from API
 * @param {string} timeRange - Selected time range
 * @param {Object} options - Processing options
 * @returns {Object} Processed data ready for graph display
 */
export const processGraphData = (rawData, timeRange, options = {}) => {
  const {
    maxDataPoints = 200,
    enableSmoothing = false,
    smoothingWindow = 5,
    dataKey = 'temperature'
  } = options;

  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return {
      processedData: [],
      graphConfig: {
        xAxis: { start: 0, end: 0, ticks: [], tickFormat: 'HH:mm' },
        yAxis: { min: 0, max: 0, ticks: [] },
        colors: []
      },
      groupedData: {},
      dataInfo: {
        totalPoints: 0,
        processedPoints: 0,
        timeSpan: 0
      }
    };
  }

  // Sort data by timestamp
  const sortedData = [...rawData].sort((a, b) => 
    new Date(a.record_time) - new Date(b.record_time)
  );

  // Apply smoothing if enabled
  let processedData = enableSmoothing 
    ? applyMovingAverage(sortedData, smoothingWindow) 
    : sortedData;

  // Apply data sampling to reduce data points
  processedData = sampleDataForGraph(processedData, maxDataPoints);

  // Group data by sensor and location
  const groupedData = groupReadingsBySensorAndLocation(processedData);

  // Create a flat array for Recharts with all sensor data
  const flatData = processedData.map(point => {
    const basePoint = {
      record_time: new Date(point.record_time).getTime(),
      timestamp: point.record_time
    };
    
    // Add each sensor's data as a separate property
    Object.entries(groupedData).forEach(([key, records]) => {
      const [sensorId] = key.split('|');
      const sensorRecord = records.find(r => r.record_time === point.record_time);
      if (sensorRecord) {
        basePoint[`sensor_${sensorId}`] = parseFloat(sensorRecord[dataKey]);
      }
    });
    
    return basePoint;
  });

  // Calculate graph configuration based on the FLAT DATA timestamps
  const graphConfig = calculateGraphConfig(flatData, dataKey);

  // Generate data info
  const dataInfo = {
    totalPoints: rawData.length,
    processedPoints: processedData.length,
    timeSpan: graphConfig.xAxis.timeSpan
  };

  return {
    processedData: flatData,
    graphConfig,
    groupedData,
    dataInfo
  };
};

/**
 * Processes raw environmental data for combined graph display
 * @param {Array} rawData - Raw environmental data from API
 * @param {string} timeRange - Selected time range
 * @param {Object} options - Processing options
 * @returns {Object} Processed data ready for combined graph display
 */
export const processCombinedGraphData = (rawData, timeRange, options = {}) => {
  const {
    maxDataPoints = 200,
    enableSmoothing = false,
    smoothingWindow = 5
  } = options;

  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return {
      processedData: [],
      graphConfig: {
        xAxis: { start: 0, end: 0, ticks: [], tickFormat: 'HH:mm' },
        yAxis: { min: 0, max: 0, ticks: [] },
        colors: []
      },
      groupedData: {},
      dataInfo: {
        totalPoints: 0,
        processedPoints: 0,
        timeSpan: 0
      }
    };
  }

  // Sort data by timestamp
  const sortedData = [...rawData].sort((a, b) => 
    new Date(a.record_time) - new Date(b.record_time)
  );

  // Apply smoothing if enabled
  let processedData = enableSmoothing 
    ? applyMovingAverage(sortedData, smoothingWindow) 
    : sortedData;

  // Apply data sampling to reduce data points
  processedData = sampleDataForGraph(processedData, maxDataPoints);

  // Group data by sensor and location
  const groupedData = groupReadingsBySensorAndLocation(processedData);

  // Create a flat array for Recharts with all sensor data for temperature
  const flatData = processedData.map(point => {
    const basePoint = {
      record_time: new Date(point.record_time).getTime(),
      timestamp: point.record_time
    };
    
    // Add each sensor's temperature data
    Object.entries(groupedData).forEach(([key, records]) => {
      const [sensorId] = key.split('|');
      const sensorRecord = records.find(r => r.record_time === point.record_time);
      if (sensorRecord) {
        basePoint[`sensor_${sensorId}`] = parseFloat(sensorRecord.temperature);
      }
    });
    
    return basePoint;
  });

  // Calculate graph configuration based on the FLAT DATA timestamps
  const graphConfig = calculateGraphConfig(flatData, 'temperature');

  // Generate data info
  const dataInfo = {
    totalPoints: rawData.length,
    processedPoints: processedData.length,
    timeSpan: graphConfig.xAxis.timeSpan
  };

  return {
    processedData: flatData,
    graphConfig,
    groupedData,
    dataInfo
  };
};

/**
 * Applies moving average smoothing to data
 */
const applyMovingAverage = (data, windowSize = 5) => {
  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, index + Math.floor(windowSize / 2) + 1);
    const window = data.slice(start, end);
    
    const avgTemp = window.reduce((sum, p) => sum + p.temperature, 0) / window.length;
    const avgHumidity = window.reduce((sum, p) => sum + p.relative_humidity, 0) / window.length;
    const avgPressure = window.reduce((sum, p) => sum + p.air_pressure, 0) / window.length;
    
    return {
      ...point,
      temperature: avgTemp,
      relative_humidity: avgHumidity,
      air_pressure: avgPressure
    };
  });
};

/**
 * Samples data to reduce the number of points for better visualization
 */
const sampleDataForGraph = (data, maxPoints = 200) => {
  if (data.length <= maxPoints) return data;
  
  const interval = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % interval === 0);
};

/**
 * Calculates optimal graph configuration based on actual data
 */
const calculateGraphConfig = (data, dataKey) => {
  // Calculate time range from actual data
  const firstTimestamp = data[0].record_time;  // Already in milliseconds
  const lastTimestamp = data[data.length - 1].record_time;  // Already in milliseconds
  const timeSpan = lastTimestamp - firstTimestamp;
  const daysSpan = timeSpan / (1000 * 60 * 60 * 24);

  // Determine optimal tick format and count based on actual data span
  const { tickFormat, tickCount } = determineTickFormat(daysSpan);
  
  // Generate x-axis ticks
  const xTicks = generateXTicks(firstTimestamp, lastTimestamp, tickCount);

  // Debug logging for tick generation
  console.log('Tick generation debug:', {
    firstTimestamp: new Date(firstTimestamp),
    lastTimestamp: new Date(lastTimestamp),
    tickCount,
    tickFormat,
    xTicks: xTicks.map(t => new Date(t)),
    daysSpan,
    timeSpan: (lastTimestamp - firstTimestamp) / (1000 * 60 * 60 * 24)
  });

  // Calculate y-axis range from actual data values
  // Extract all sensor values from the flat data structure
  const allValues = [];
  data.forEach(d => {
    // Look for sensor-specific properties (e.g., sensor_001, sensor_002)
    Object.keys(d).forEach(key => {
      if (key.startsWith('sensor_') && typeof d[key] === 'number' && !isNaN(d[key])) {
        allValues.push(d[key]);
      }
    });
  });
  
  if (allValues.length === 0) {
    // Fallback: try to use the dataKey if it exists
    const fallbackValues = data.map(d => parseFloat(d[dataKey])).filter(v => !isNaN(v));
    if (fallbackValues.length > 0) {
      allValues.push(...fallbackValues);
    }
  }
  
  if (allValues.length === 0) {
    // No valid values found, return default config
    return {
      xAxis: {
        start: firstTimestamp,
        end: lastTimestamp,
        ticks: xTicks,
        tickFormat,
        timeSpan: daysSpan
      },
      yAxis: {
        min: 0,
        max: 100,
        ticks: [0, 25, 50, 75, 100]
      },
      colors
    };
  }
  
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);
  const yPadding = (yMax - yMin) * 0.05;
  
  // Generate y-axis ticks
  const yTicks = generateYTicks(yMin - yPadding, yMax + yPadding, 5);

  // Debug logging for Y-axis calculation
  console.log('Y-axis calculation debug:', {
    dataKey,
    allValues: allValues.slice(0, 10), // Show first 10 values
    yMin,
    yMax,
    yPadding,
    yTicks,
    dataSample: data.slice(0, 3).map(d => Object.keys(d).filter(k => k.startsWith('sensor_')))
  });

  // Define colors for different sensors
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA500', '#005670'];

  return {
    xAxis: {
      start: firstTimestamp,
      end: lastTimestamp,
      ticks: xTicks,
      tickFormat,
      timeSpan: daysSpan
    },
    yAxis: {
      min: Math.floor(yMin - yPadding),
      max: Math.ceil(yMax + yPadding),
      ticks: yTicks
    },
    colors
  };
};

/**
 * Determines optimal tick format based on data time span
 */
const determineTickFormat = (daysSpan) => {
  if (daysSpan < 1) {
    // Less than 24 hours - show hours and minutes
    if (daysSpan <= 0.1) {
      return { tickFormat: 'HH:mm', tickCount: 3 };    // 2.4 hours or less
    } else if (daysSpan <= 0.5) {
      return { tickFormat: 'HH:mm', tickCount: 4 };    // 12 hours or less
    } else {
      return { tickFormat: 'HH:mm', tickCount: 6 };    // 24 hours - show every 4 hours
    }
  } else if (daysSpan < 30) {
    // 1 day up to but less than 1 month - show days
    if (daysSpan <= 3) {
      return { tickFormat: 'dd/MM', tickCount: 4 };    // 3 days or less
    } else if (daysSpan <= 7) {
      return { tickFormat: 'dd/MM', tickCount: 6 };    // 1 week or less
    } else if (daysSpan <= 14) {
      return { tickFormat: 'dd/MM', tickCount: 7 };    // 2 weeks or less
    } else {
      return { tickFormat: 'dd/MM', tickCount: 8 };    // 1 month or less
    }
  } else {
    // 1 month or longer - show months and years
    if (daysSpan <= 180) {
      return { tickFormat: 'MM/yyyy', tickCount: 6 };  // 6 months or less
    } else if (daysSpan <= 365) {
      return { tickFormat: 'MM/yyyy', tickCount: 8 };  // 1 year or less
    } else {
      return { tickFormat: 'MM/yyyy', tickCount: 10 }; // More than 1 year
    }
  }
};

/**
 * Generates evenly distributed x-axis ticks
 */
const generateXTicks = (start, end, count) => {
  const ticks = [];
  
  // Handle edge cases
  if (count <= 1) {
    ticks.push(start);
    return ticks;
  }
  
  if (start === end) {
    // If start and end are the same, just return the single timestamp
    ticks.push(start);
    return ticks;
  }
  
  // Ensure we have at least 2 ticks for proper spacing
  if (count < 2) count = 2;
  
  // For very short time spans, ensure we don't have too many ticks
  const timeSpan = end - start;
  const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
  
  // For 24-hour data, ensure we get meaningful hourly ticks
  if (daysSpan <= 1) {
    // Force 6 ticks for 24-hour data to show every 4 hours
    count = 6;
  } else if (daysSpan < 7 && count > 8) {
    count = 8; // Max 8 ticks for less than 1 week
  } else if (daysSpan < 30 && count > 10) {
    count = 10; // Max 10 ticks for less than 1 month
  }
  
  // Generate evenly distributed ticks
  const interval = (end - start) / (count - 1);
  
  for (let i = 0; i < count; i++) {
    ticks.push(start + (i * interval));
  }
  
  return ticks;
};

/**
 * Generates evenly distributed y-axis ticks
 */
const generateYTicks = (min, max, count) => {
  const ticks = [];
  const interval = (max - min) / (count - 1);
  
  for (let i = 0; i < count; i++) {
    ticks.push(Math.round((min + (i * interval)) * 10) / 10);
  }
  
  return ticks;
};

/**
 * Formats timestamp for display based on the determined format
 */
export const formatTimestamp = (timestamp, tickFormat) => {
  return format(timestamp, tickFormat);
}; 