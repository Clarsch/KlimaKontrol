import time
import sys
import os

# Add the parent directory to the Python path so we can import from utils
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(parent_dir)

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from modules.Authorization import Authorization 
from modules.DataRequester import DataRequester
from modules.DataPullRunner import DataPullRunner, DataPullRunnerThread
from utils.Logger import Logger
import asyncio


def main():
    base_url = 'https://api.sensorpush.com'
    
    # Initialize logger
    logger = Logger('sensorpush_loader', os.path.join(os.path.dirname(__file__), 'sensorpush_loader.log'))

    queue = asyncio.Queue()

    auth = Authorization(logger, base_url)
    data_requester = DataRequester(logger, auth, base_url)
    data_pull_runner = DataPullRunner(logger, auth)

    runner_thread = None
    
    while not auth.is_authorized():
        print("Authorizing....")
        time.sleep(1)
            
    print("Welcome! You have now been authorized!")
    
    while True:
        action = input("Choose an action: gateways, sensors, samples, exit: ").strip()
        if action == 'api':
            url = input("What endpoint do you want to reach: https://api.sensorpush.com/ + ").strip()
            data_requester.call_endpoint(url)  
        elif action == 'gateways':
            data_requester.list_gateways()  
        elif action == 'sensors':
            data_requester.list_sensors()      
        elif action == 'samples_simple':
            data_requester.list_samples_simple()       
        elif action == 'samples':
            sensor_ids = input("Sensor ids list split by semicolons; : ").strip()
            try:
                max_records = int(input("Max records: ").strip())
            except ValueError:
                print("Error: Max records must be a valid integer")
                continue
            start_date = input("Start datetime(2025-01-25T00:00:00.000Z): ").strip()
            end_date = input("End datetime(2025-01-26T00:00:00.000Z): ").strip()
            data_requester.list_samples(sensor_ids, max_records, start_date, end_date)      
        elif action == 'access':
            print(f"Access Token is: {auth.get_access_token()}")   
        elif action == 'print':
            observations = data_pull_runner._observations
            print(observations)
            print(f"Observations does now contain {len(observations)} readings")

        elif action == 'runner':
            try:
                time_interval = int(input("How many minutes between each reading?: ").strip())
            except ValueError:
                print("Error: Time interval must be a valid integer")
                continue
            runner_thread = DataPullRunnerThread(logger, data_pull_runner)
            runner_thread.set_time_interval(time_interval)
            runner_thread.start()
            
        elif action == 'stop':
            if not runner_thread == None:
                runner_thread.stop()
                runner_thread.join() #waiting for the thread to finish
                runner_thread = None
        elif action == 'next':
            continue
        elif action == 'exit':
            if not runner_thread == None:
                runner_thread.stop()
                runner_thread.join() #waiting for the thread to finish
                runner_thread = None
            break


main()