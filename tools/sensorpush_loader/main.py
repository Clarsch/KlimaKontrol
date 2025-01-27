import time
from modules.Authorization import Authorization 
from modules.DataRequester import DataRequester
from modules.DataPullRunner import DataPullRunner, DataPullRunnerThread
import asyncio


def main():
    base_url = 'https://api.sensorpush.com'

    queue = asyncio.Queue()

    auth = Authorization(base_url)
    data_requester = DataRequester(auth, base_url)
    data_pull_runner = DataPullRunner(queue, auth)

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
            max_records = input("Max records: ").strip()
            start_date = input("Start datetime(2025-01-25T00:00:00.000Z): ").strip()
            end_date = input("End datetime(2025-01-26T00:00:00.000Z): ").strip()
            data_requester.list_samples(sensor_ids, max_records, start_date, end_date)      
        elif action == 'access':
            print(f"Access Token is: {auth.get_access_token()}")   
        elif action == 'print':
            observations = data_pull_runner.observations
            print(observations)
            print(f"Observations does now contain {len(observations)} readings")

        elif action == 'runner':
            time_interval = input("How many minutes between each reading?: ").strip()
            runner_thread = DataPullRunnerThread(data_pull_runner)
            runner_thread.set_time_interval(int(time_interval))
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