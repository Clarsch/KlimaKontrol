const API_URL = import.meta.env.VITE_API_URL;

export const fetchActiveWarnings = async () => {
  try {
    const response = await fetch(`${API_URL}/api/data/warnings/active`);
    if (!response.ok) {
      throw new Error('Failed to fetch active warnings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching active warnings:', error);
    throw error;
  }
}; 