export const formatMeasurement = (value, type) => {
  if (typeof value !== 'number') return value;
  
  const fixed = value.toFixed(1);
  switch (type) {
    case 'temperature':
      return `${fixed}°C`;
    case 'relative_humidity':
      return `${fixed}%`;
    case 'air_pressure':
      return `${fixed}hPa`;
    default:
      return fixed;
  }
};

export const formatTimestamp = (timestamp) => {
  return format(new Date(timestamp), t('date_time_format'));
}; 