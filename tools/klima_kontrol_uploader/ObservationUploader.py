import requests
import asyncio
import threading
import klima_kontrol_uploader.ObservationTransformer as transformer


class ObservationUploader:

    backend_url = "http://localhost:5001"
    data_url = backend_url + "/api/data"
    data_location_status = data_url + "/locations/status"
    data_readings_url = data_url + "/reading/dataReading"

    def post_data_observation(self, observation):

        try:
            print("Started processing data...")
            data = transformer.observation_to_klimakontrol_reading(observation, 'loejt')
            print(f"Data is transformed to: {data}")
            response = requests.post(self.data_readings_url, json=data)
            print("Posting data...")
            response.raise_for_status()
            print("Posting data reading is completed!")

        except requests.exceptions.RequestException as e:
            # Handle any errors that occur during the request
            print("An error occurred:", e)

class ObservationUploaderRunner(threading.Thread):

    def __init__(self, queue:asyncio.Queue):
        super().__init__()
        self.uploader = ObservationUploader()
        self.async_queue = queue
        self._stop_event = threading.Event()


    def run(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self._run())
        finally:
            loop.close()


    async def _run(self):
        while not self._stop_event.is_set():
            print("Awaiting data in queue...")
            data = await self.async_queue.get()
            print(f"Data received in queue. Processing: {data}")
            self.uploader.post_data_observation(data)
            print("Processing done.")
        
        print("Observation Uploader runner stopped")
    

    def stop(self):
        self._stop_event.set()
    


