import axiosInstance from './axiosConfig';

export const fetchActiveWarnings = async () => {
  try {
    const response = await axiosInstance.get('/api/data/warnings/active');
    if (!response.ok) {
      throw new Error('Failed to fetch active warnings');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching active warnings:', error);
    throw error;
  }
}; 