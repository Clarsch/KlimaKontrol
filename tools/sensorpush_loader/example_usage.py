"""
Example usage of the SensorPush Loader API
This demonstrates how other programs can import and use the sensorpush loader.
"""

import sys
import os

# Add the project root to the path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from tools.sensorpush_loader.api import SensorPushLoader, create_loader, quick_start

def example_basic_usage():
    """Basic usage example"""
    print("=== Basic Usage Example ===")
    
    # Create a loader instance
    loader = create_loader()
    
    # Wait for authorization
    if not loader.wait_for_authorization(timeout=30):
        print("Failed to authorize with SensorPush API")
        return
    
    print("Successfully authorized!")
    
    # Get some basic data
    print("Getting gateways...")
    gateways = loader.list_gateways()
    print(f"Found {len(gateways) if gateways else 0} gateways")
    
    print("Getting sensors...")
    sensors = loader.list_sensors()
    print(f"Found {len(sensors) if sensors else 0} sensors")
    
    # Get some sample data
    print("Getting sample data...")
    samples = loader.get_samples_simple(limit=5)
    print(f"Retrieved sample data: {samples is not None}")

def example_data_pulling():
    """Example of continuous data pulling"""
    print("\n=== Data Pulling Example ===")
    
    # Create loader and start data pulling
    loader = create_loader()
    
    if not loader.wait_for_authorization(timeout=30):
        print("Failed to authorize with SensorPush API")
        return
    
    # Set a location for data uploads
    loader.set_location("test_location_001")
    
    # Start data pulling every 2 minutes
    if loader.start_data_pull_runner(interval_minutes=2):
        print("Data pull runner started successfully")
        
        # Let it run for a bit
        import time
        print("Running for 10 seconds...")
        time.sleep(10)
        
        # Check observations
        obs_count = loader.get_observation_count()
        print(f"Collected {obs_count} observations")
        
        # Stop the runner
        loader.stop_data_pull_runner()
        print("Data pull runner stopped")
    else:
        print("Failed to start data pull runner")

def example_quick_start():
    """Example using the quick_start convenience function"""
    print("\n=== Quick Start Example ===")
    
    try:
        # Quick start with 1 minute intervals
        loader = quick_start(interval_minutes=1)
        print("Quick start successful!")
        
        # Let it run briefly
        import time
        time.sleep(5)
        
        # Check status
        obs_count = loader.get_observation_count()
        print(f"Quick start collected {obs_count} observations")
        
        # Clean up
        loader.stop_data_pull_runner()
        
    except Exception as e:
        print(f"Quick start failed: {e}")

if __name__ == "__main__":
    print("SensorPush Loader API Examples")
    print("=" * 40)
    
    # Run examples
    example_basic_usage()
    example_data_pulling()
    example_quick_start()
    
    print("\nExamples completed!")
