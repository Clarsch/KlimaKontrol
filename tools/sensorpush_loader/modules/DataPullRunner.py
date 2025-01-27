import threading
import asyncio
from datetime import datetime, timedelta, timezone
from modules.DataRequester import DataRequester 
from modules.Authorization import Authorization
import modules.Formatter as fm


class DataPullRunner():

    observations = {}

    def __init__(self, auth = None, base_url = 'https://api.sensorpush.com'):
        self.auth = Authorization(base_url) if auth == None else auth
        self.dataRequester = DataRequester(auth, base_url)
        self.last_datapoint_reading = datetime.now() - timedelta(days=365)        


    def get_all_sensor_ids(self):
        return ["16938384.41622496812705309768"]
    
    async def pull_data(self):
        sensor_ids = self.get_all_sensor_ids()
        max_records = 20000 # * number_of_sensors

        enddate_formatted = fm.datetime_to_utc_format(datetime.now(timezone.utc))        
        startdate = self.last_datapoint_reading 
        startdate_formatted = fm.datetime_to_utc_format(startdate)
        #print("\rNew readings at: {} from {}".format(enddate_formatted, startdate_formatted), end='\n', flush=True)

        data = self.dataRequester.get_data_records(sensor_ids, max_records, startdate_formatted, enddate_formatted)
        #print(fm.prettify_json(data))

        if not 'sensors' in data:
            print(f"No valid sensor data in pulled data...")
            return
        sensors = data['sensors'].items()
        for sensor in sensors:
            sensor_id = sensor[0]
            for observation in sensor[1]:
                #print(f"Reading is: {fm.prettify_json(observation)}")
                if 'observed' in observation: 
                    datetime_observed_string = observation['observed']
                    observed_naive = fm.string_to_naive_datetime(datetime_observed_string) 
                    if observed_naive > self.last_datapoint_reading:
                        self.last_datapoint_reading = observed_naive
                        #print(f"Last datapoint reading time has been updated to: {datetime_observed_string}")
                    id_string = sensor_id + datetime_observed_string
                    id_hash = fm.get_hash_id_from_string(id_string)
                    if not id_hash in self.observations:
                        self.observations[id_hash] = observation


        #print("Completed reading.")


    async def pull_data_runner(self, waiting_time_in_minutes:int, stop_event:threading.Event): 
        waiting_interval = timedelta(minutes=waiting_time_in_minutes)
        next_tick = datetime.now() 

        while not stop_event.is_set():
            #print("Checking....")
            if next_tick <= datetime.now():
                next_tick = next_tick + waiting_interval
                await self.pull_data()
        
            await asyncio.sleep(5)


class DataPullRunnerThread(threading.Thread):

    def __init__(self, data_pull_runner: DataPullRunner):
        super().__init__()
        self.data_runner = data_pull_runner
        self.waiting_time_interval = 5
        self._stop_event = threading.Event()

    def set_time_interval(self, new_interval:int):
        self.waiting_time_interval = new_interval

    def run(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self._run())
        finally:
            loop.close()

    async def _run(self):
        while not self._stop_event.is_set():
            await self.data_runner.pull_data_runner(self.waiting_time_interval, self._stop_event)

    def stop(self):
        self._stop_event.set()



