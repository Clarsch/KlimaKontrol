from sensorpush_loader.modules.DataPullRunner import DataPullRunner, DataPullRunnerThread
from sensorpush_loader.modules.Authorization import Authorization
from utils.Logger import Logger
from datetime import datetime
import sensorpush_loader.modules.Formatter as fm



def main():
    app_name = 'DataTransferRunner'
    log_filename = f"{fm.datetime_to_simple_datetime_string(datetime.now())}_{app_name}.log"
    logger = Logger(app_name, f'../logs/{log_filename}')
    TAG = main.__name__    

    auth = Authorization(logger, 'https://api.sensorpush.com')
    
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



    def start_threads(location_id, time_interval):
        logger.debug(TAG, "Starting threads...")
        data_puller = DataPullRunner(logger, auth=auth, run_test_config=True)

        pull_thread = DataPullRunnerThread(logger, data_puller)
        runner_threads.append(pull_thread)
        data_puller.set_temp_location(location_id)
        data_puller.set_data_pull_sleep_interval_in_minutes(int(time_interval))
        pull_thread.start()
        logger.debug(TAG, f"DataPullThread:{pull_thread} has been STARTED")

    def console():
        
        print("\nWelcome to the Data Transfer Runner:")
        help_desc               = "  help       -> Show the options again\n"
        exit_desc               = "  exit       -> Exit the session\n"
        start_desc              = "  start      -> Starts the Data Transfer Runner\n"
        stop_desc               = "  stop       -> Stop the Data Transfer Runner\n"
        logger_settings_desc    = "  logger     -> Opens the logger settings\n"
        options = f"Options:\n{help_desc}{exit_desc}{start_desc}{stop_desc}{logger_settings_desc}"
        print(options)
        
        try:
            while True:
                action = input("Select option: ").strip()
                if action == 'help' or action == '-h':
                    print(options)
                elif action == "start":
                    location_id = input("Push data for location_id: ").strip()
                    sensor_to_location_mapping['16938384.41622496812705309768'] = (str(location_id), '16938384.41622496812705309768')
                    time_interval = input("How many minutes between each reading?: ").strip()
                    start_threads(location_id, time_interval)
                elif action == 'stop':
                    dispose_running_threads()
                    print(f"The {app_name} has now been stopped")
                elif action == 'logger_settings' or action == 'logger':
                    logger.logger_console_settings()
                    print("\nYou are now back at the Data Transfer Runner")
                    print(options)
                elif action == 'exit':
                    break
        finally:
            dispose_running_threads()


    console()


main()