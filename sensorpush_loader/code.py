import time
from modules.Authorization import Authorization 
from modules.DataRequester import DataRequester


def main():
    debug = False
    base_url = 'https://api.sensorpush.com'

    auth = Authorization(base_url)
    dataRequester = DataRequester(auth, base_url)


    while not auth.isAuthorized():
        print("Authorizing....")
        time.sleep(1)
            
    print("Welcome! You have now been authorized!")

    while True:
        action = input("Choose an action: gateways, sensors, samples, exit: ")
        if action == 'debug':
            debug = not debug  
        elif action == 'gateways':
            dataRequester.list_gateways()  
        elif action == 'sensors':
            dataRequester.list_sensors()      
        elif action == 'samples_simple':
            dataRequester.list_samples_simple()       
        elif action == 'samples':
            sensor_ids = input("Sensor ids list split by semicolons; : ").strip()
            max_records = input("Max records: ").strip()
            start_date = input("Start datetime(2025-01-25T00:00:00.000Z): ").strip()
            end_date = input("End datetime(2025-01-26T00:00:00.000Z): ").strip()
            dataRequester.list_samples(sensor_ids, max_records, start_date, end_date)      
        elif action == 'access':
            print(f"Access Token is: {auth.access_token}")   
        elif action == 'exit':
            break


main()