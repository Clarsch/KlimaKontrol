const withRetry = async (operation, maxRetries = 3, onRetry = () => {}) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't wait on the last attempt
      if (i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000); // Cap at 10 seconds
        onRetry(i + 1, maxRetries, delay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

const withOptimisticUpdate = async (updateState, operation, revertState) => {
  try {
    updateState();
    await operation();
  } catch (error) {
    revertState();
    throw error;
  }
};

export { withRetry, withOptimisticUpdate }; 