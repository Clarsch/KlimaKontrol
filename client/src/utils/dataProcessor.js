// Utility to group environmental data by sensor_id and location_id
export function groupReadingsBySensorAndLocation(data) {
  // Handle null, undefined, or empty data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {};
  }
  
  // Returns an object: { 'sensor_id|location_id': [records...] }
  return data.reduce((acc, record) => {
    const key = `${record.sensor_id}|${record.location_id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {});
} 