from sensorpush_loader.modules.DataPullRunner import DataPullRunner, DataPullRunnerThread
from sensorpush_loader.modules.Authorization import Authorization
from klima_kontrol_uploader.ObservationUploader import ObservationUploaderRunner 
import asyncio
import threading



def main():

    sensor_to_location_mapping = {}
    auth = Authorization('https://api.sensorpush.com')
    
    runner_threads = []

    def dispose_running_threads():
        for thread in runner_threads:
            thread.stop()
        for thread in runner_threads:
            thread.join() #waiting for the thread to finish
            runner_threads.remove(thread)


    def start_threads(time_interval):
        async_queue = asyncio.Queue()
        data_puller = DataPullRunner(async_queue, auth=auth)

        '''
        push_thread = ObservationUploaderRunner(async_queue)
        runner_threads.append(push_thread)
        push_thread.start()
        '''
        pull_thread = DataPullRunnerThread(data_puller)
        runner_threads.append(pull_thread)
        pull_thread.set_time_interval(int(time_interval))
        pull_thread.start()


    while True:
        action = input("Choose an action: start, stop, exit: ").strip()
        if action == "start":
            location_id = input("Push data for location_id: ").strip()
            sensor_to_location_mapping['16938384.41622496812705309768'] = (str(location_id), '16938384.41622496812705309768')
            time_interval = input("How many minutes between each reading?: ").strip()
            start_threads(time_interval)
            
        elif action == 'stop':
            dispose_running_threads()
        elif action == 'next':
            continue
        elif action == 'exit':
            dispose_running_threads()
            break

main()