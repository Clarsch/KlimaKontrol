import threading
import asyncio
from datetime import datetime, timedelta, timezone
from sensorpush_loader.modules.DataRequester import DataRequester
from sensorpush_loader.modules.Authorization import Authorization
import sensorpush_loader.modules.Formatter as fm
from klima_kontrol_uploader.ObservationUploader import ObservationUploader
from utils.Logger import Logger


class DataPullRunner:

    TAG = "DataPullRunner"
    _observations = {}
    _test_config = {'startTimeDelta': 24, 'maxRecords': 20000}
    _full_config = {'startTimeDelta': 24*365, 'maxRecords': 20000}

    def __init__(self, logger:Logger, auth:Authorization, run_test_config = False):
        self.logger = logger
        self.auth = auth
        self.run_test_config = run_test_config
        self.data_pull_sleep_interval_in_minutes = 5
        self.dataRequester = DataRequester(logger, auth, auth.base_url)
        self.last_datapoint_reading = datetime.now() - timedelta(hours=self._get_config()['startTimeDelta']) #- timedelta(days=365)        
        self.observation_uploader = ObservationUploader(logger)
        logger.info(self.TAG, f"INITIALIZED. RunTestConfig: {run_test_config}. LastDatapointReading set to: {self.last_datapoint_reading}")

    

    def _get_config(self):
        if self.run_test_config:
            return self._test_config
        else:
            return self._full_config

    def set_temp_location(self, location_id):
        self.temp_location_id = location_id

    def set_data_pull_sleep_interval_in_minutes(self, sleep_interval_in_minutes):
        self.data_pull_sleep_interval_in_minutes = sleep_interval_in_minutes
    
    def _get_all_sensor_ids(self):
        return ["16938384.41622496812705309768"]
    
    def handle_observation(self, sensor_id, observation):
        if 'observed' in observation: 
            datetime_observed_string = observation['observed']
            observed_naive = fm.string_to_naive_datetime(datetime_observed_string) 

            if observed_naive > self.last_datapoint_reading:
                self.last_datapoint_reading = observed_naive
                self.logger.debug(self.TAG, f"HandleObservation: Last datapoint reading time has been UPDATED to: {datetime_observed_string}")
            id_string = sensor_id + datetime_observed_string
            id_hash = fm.get_hash_id_from_string(id_string)
            if not id_hash in self._observations:
                self.logger.debug(self.TAG, f"HandleObservation: ADDING new Observation with ID: {id_hash} ")
                self._observations[id_hash] = observation
                self.observation_uploader.post_data_observation(observation, self.temp_location_id)
    
    async def _pull_data(self):
        sensor_ids = self._get_all_sensor_ids()
        max_records = self._get_config()['maxRecords'] # * number_of_sensors

        enddate_formatted = fm.datetime_to_utc_format(datetime.now(timezone.utc) + timedelta(minutes=10))        
        startdate = self.last_datapoint_reading 
        startdate_formatted = fm.datetime_to_utc_format(startdate)
        self.logger.debug(self.TAG, f"New readings from {startdate_formatted} to {enddate_formatted}")

        data = self.dataRequester.get_data_observations(sensor_ids, max_records, startdate_formatted, enddate_formatted)
        self.logger.debug(self.TAG, f"Data received: {fm.prettify_json(data)}")

        if not 'sensors' in data:
            self.logger.debug(self.TAG, f"No valid sensor data in pulled data...")
            return
        sensors = data['sensors'].items()
        for sensor in sensors:
            sensor_id = sensor[0]
            self.logger.debug(self.TAG, f"Processing {len(sensor[1])} observations...")
            for observation in sensor[1]:
                self.logger.debug(self.TAG, f"Reading is: {fm.prettify_json(observation)}")
                self.handle_observation(sensor_id, observation)                

        self.logger.debug(self.TAG, "PullData: COMPLETED data reading.")


    async def pull_data_runner(self, stop_event:threading.Event): 
        next_tick = datetime.now() 

        while not stop_event.is_set():
            #self.logger.debug(self.TAG, "PullDataRunner: Checking....")
            if next_tick <= datetime.now():
                next_tick = next_tick + timedelta(minutes=self.data_pull_sleep_interval_in_minutes)
                await self._pull_data()
        
            await asyncio.sleep(5)


class DataPullRunnerThread(threading.Thread):
    TAG = 'DataPullRunnerThread'

    def __init__(self, logger:Logger, data_pull_runner: DataPullRunner):
        super().__init__()
        self.logger = logger
        self.data_runner = data_pull_runner
        self._stop_event = threading.Event()
        logger.debug(self.TAG, "INITIALIZED")

    def run(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            self.logger.debug(self.TAG, "STARTED")
            loop.run_until_complete(self._run())
        finally:
            loop.close()
            self.logger.debug(self.TAG, "CLOSED")

    async def _run(self):
        while not self._stop_event.is_set():
            await self.data_runner.pull_data_runner(self._stop_event)
        self.logger.debug(self.TAG, "STOPPED")


    def stop(self):
        self.logger.debug(self.TAG, "STOP event triggered.")
        self._stop_event.set()




