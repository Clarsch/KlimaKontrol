import requests
import klima_kontrol_uploader.ObservationTransformer as transformer
from utils.Logger import Logger

class ObservationUploader:
    TAG = 'ObservationUploader'

    backend_url = "http://localhost:5001"
    data_url = backend_url + "/api/data"
    data_location_status = data_url + "/locations/status"
    data_readings_url = data_url + "/reading/dataReading"

    def __init__(self, logger:Logger):
        self.logger = logger
        logger.info(self.TAG, f"INITIALIZED.")



    def post_data_observation(self, observation, temp_location_id):

        try:
            self.logger.debug(self.TAG, "Started processing data...")
            data = transformer.observation_to_klimakontrol_reading(observation, temp_location_id)
            self.logger.debug(self.TAG, f"Data is transformed to: {data}")
            response = requests.post(self.data_readings_url, json=data)
            self.logger.debug(self.TAG, "Posting data...")
            response.raise_for_status()
            self.logger.debug(self.TAG, "Posting data reading is completed!")

        except requests.exceptions.RequestException as e:
            # Handle any errors that occur during the request
            self.logger.error(self.TAG, "An error occurred: {e}")

