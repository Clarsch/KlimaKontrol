# Graph Components

This directory contains React components for displaying environmental data graphs.

## GraphComponent

A pure rendering component that displays line charts based on pre-processed data. The component is responsible only for rendering and does not perform any data manipulation.

### Props

- `processedData` (Array): Pre-processed data array ready for display
- `graphConfig` (Object): Configuration object containing:
  - `xAxis`: X-axis configuration (start, end, ticks, tickFormat)
  - `yAxis`: Y-axis configuration (min, max, ticks)
  - `colors`: Array of colors for different sensor lines
- `groupedData` (Object): Data grouped by sensor and location
- `dataInfo` (Object): Information about the data (totalPoints, processedPoints, timeSpan)
- `dataKey` (string): The data property to display on the Y-axis
- `unit` (string): Unit of measurement for the data
- `thresholds` (Object): Threshold values for min/max lines
- `groundTemp` (number, optional): Ground temperature reference line
- `locationName` (string): Name of the location being displayed
- `graphType` (string): Type of graph ('single' or 'combined')
- `height` (string): Height of the graph container
- `showSensorLabels` (boolean): Whether to show sensor labels below the graph

### Usage

The GraphComponent expects all data to be pre-processed using the `processGraphData` utility function. This separation of concerns ensures that:

1. **Data processing** is handled by dedicated utilities
2. **Graph rendering** is the sole responsibility of this component
3. **X-axis labels** are automatically determined based on the actual data span
4. **Performance** is optimized by processing data once and reusing it

### Example

```jsx
import { processGraphData } from '../utils/graphDataProcessor';

// Process data before passing to component
const processedData = processGraphData(rawData, timeRange, {
  maxDataPoints: 150,
  enableSmoothing: true,
  smoothingWindow: 3,
  dataKey: 'temperature'
});

// Pass processed data to component
<GraphComponent
  processedData={processedData.processedData}
  graphConfig={processedData.graphConfig}
  groupedData={processedData.groupedData}
  dataInfo={processedData.dataInfo}
  dataKey="temperature"
  unit="°C"
  thresholds={thresholds.temperature}
  locationName="Location Name"
  graphType="single"
/>
```

## Data Processing

All data processing is handled by the `graphDataProcessor` utility, which:

- Sorts data by timestamp
- Applies smoothing if enabled
- Samples data to reduce points for better visualization
- Groups data by sensor and location
- Calculates optimal graph configuration based on actual data
- Generates appropriate x-axis and y-axis ticks
- Determines optimal tick format based on data time span

## Architecture Benefits

1. **Single Responsibility**: GraphComponent only renders, doesn't process data
2. **Reusability**: Can be used with any pre-processed data
3. **Performance**: Data processing happens once, not on every render
4. **Maintainability**: Clear separation between data logic and presentation logic
5. **Testing**: Easier to test data processing and rendering separately 