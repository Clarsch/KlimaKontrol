from sensorpush_loader.modules.DataPullRunner import DataPullRunner



def main():

    data_puller = DataPullRunner()
    data_puller.pull_data_runner

    while True:
        action = input("Choose an action: gateways, sensors, samples, exit: ").strip()
        if action == "start":
            location_id = input("Push data for location_id: ").strip()


main()