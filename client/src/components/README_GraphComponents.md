# Graph Components Documentation

## Overview

The graph system has been refactored into a reusable `GraphComponent` that supports sensor labels and can be used to create multiple separate graph cards stacked vertically on a page.

## Components

### GraphComponent

A reusable graph component that can render both single parameter graphs and combined graphs.

#### Props

- `data` (array): Environmental data array
- `dataKey` (string): The data key to plot (e.g., 'temperature', 'relative_humidity', 'air_pressure')
- `unit` (string): Unit of measurement (e.g., '°C', '%', 'hPa')
- `thresholds` (object): Min/max threshold values
- `groundTemp` (number, optional): Ground temperature reference line
- `timeRange` (string): Time range for the graph ('1day', '1week', '1month', '1year', '2year')
- `locationName` (string): Name of the location
- `graphType` (string): 'single' or 'combined'
- `height` (string): Height of the graph container
- `showSensorLabels` (boolean): Whether to show sensor labels below the graph

#### Example Usage

```jsx
<GraphComponent
  data={environmentalData}
  dataKey="temperature"
  unit="°C"
  thresholds={thresholds.temperature}
  groundTemp={settings.groundTemperature}
  timeRange={timeRange}
  locationName={locationData?.name}
  graphType="single"
  height="100%"
  showSensorLabels={true}
/>
```

## Features

### Sensor Labels

All graphs include sensor name labels at the bottom with color-coded dots matching the graph lines.

### Multiple Graph Cards

You can create multiple `GraphCard` containers, each with its own `GraphComponent` instance, stacked vertically on the page:

```jsx
<GraphCard>
  <GraphTitle>Temperature Graph</GraphTitle>
  <GraphComponent
    data={environmentalData}
    dataKey="temperature"
    unit="°C"
    thresholds={thresholds.temperature}
    groundTemp={settings.groundTemperature}
    timeRange={timeRange}
    locationName={locationData?.name}
    graphType="single"
    height="100%"
    showSensorLabels={true}
  />
</GraphCard>

<GraphCard>
  <GraphTitle>Humidity Graph</GraphTitle>
  <GraphComponent
    data={environmentalData}
    dataKey="relative_humidity"
    unit="%"
    thresholds={thresholds.humidity}
    timeRange={timeRange}
    locationName={locationData?.name}
    graphType="single"
    height="100%"
    showSensorLabels={true}
  />
</GraphCard>

<GraphCard>
  <GraphTitle>Pressure Graph</GraphTitle>
  <GraphComponent
    data={environmentalData}
    dataKey="air_pressure"
    unit="hPa"
    thresholds={thresholds.pressure}
    timeRange={timeRange}
    locationName={locationData?.name}
    graphType="single"
    height="100%"
    showSensorLabels={true}
  />
</GraphCard>
```

### Error Handling

All graphs are wrapped in `GraphErrorBoundary` components for graceful error handling.

## Migration from Old System

The old graph rendering functions (`renderGraph` and `renderCombinedGraph`) have been replaced with the new `GraphComponent`. The new system provides:

1. Better reusability
2. Sensor labels with color coding
3. Cleaner separation of concerns
4. Better error handling
5. Self-contained graph cards

## Styling

Graphs use styled-components and are responsive. The `GraphCard` component provides the container styling with:
- Fixed height of 400px
- Proper padding and margins
- Overflow hidden to ensure content stays within boundaries
- Clean card-based layout

Each graph card is completely self-contained and will not overlap with other cards on the page. 