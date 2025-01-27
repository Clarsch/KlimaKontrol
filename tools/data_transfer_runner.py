from sensorpush_loader.modules.DataPullRunner import DataPullRunner, DataPullRunnerThread
from sensorpush_loader.modules.Authorization import Authorization
from klima_kontrol_uploader.ObservationUploader import ObservationUploaderRunner 
import asyncio
from data_sync.logger import Logger



def main():
    app_name = 'DataTransferRunner'
    logger = Logger(app_name, f'../logs/{app_name}-app.log')
    TAG = main.__name__    

    auth = Authorization('https://api.sensorpush.com')
    
    sensor_to_location_mapping = {}
    runner_threads = []

    def dispose_running_threads():
        logger.debug(TAG, "Disposing of threads...")
        for thread in runner_threads:
            thread.stop()
            logger.debug(TAG, f"{thread} has been STOPPED")

        for thread in runner_threads:
            thread.join() #waiting for the thread to finish
            runner_threads.remove(thread)
            logger.debug(TAG, f"{thread} has been REMOVED")



    def start_threads(time_interval):
        logger.debug(TAG, "Starting threads...")
        async_queue = asyncio.Queue()
        data_puller = DataPullRunner(async_queue, auth=auth)

        pull_thread = DataPullRunnerThread(data_puller)
        runner_threads.append(pull_thread)
        pull_thread.set_time_interval(int(time_interval))
        pull_thread.start()
        logger.debug(TAG, f"DataPullThread:{pull_thread} has been STARTED")

    def console():
        
        print("\nWelcome to the Data Transfer Runner:")
        help_desc               = "  help               -> Show the options again\n"
        exit_desc               = "  exit               -> Exit the session\n"
        start_desc              = "  start              -> Starts the Data Transfer Runner\n"
        stop_desc               = "  stop               -> Stop the Data Transfer Runner\n"
        logger_settings_desc    = "  logger_settings    -> Opens the logger settings\n"
        options = f"Options:\n{help_desc}{exit_desc}{start_desc}{stop_desc}{logger_settings_desc}"
        print(options)
        
        while True:
            action = input("Select option: ").strip()
            if action == 'help' or action == '-h':
                print(options)
            elif action == "start":
                location_id = input("Push data for location_id: ").strip()
                sensor_to_location_mapping['16938384.41622496812705309768'] = (str(location_id), '16938384.41622496812705309768')
                time_interval = input("How many minutes between each reading?: ").strip()
                start_threads(time_interval)
            elif action == 'stop':
                dispose_running_threads()
            elif action == 'logger_settings' or action == 'logger':
                logger.logger_console_settings()
                print("\nYou are now back at the Data Transfer Runner")
                print(options)
            elif action == 'exit':
                dispose_running_threads()
                break
    
    console()


main()