# KlimaKontrol

_The KlimaKontrol project is a monitoring solution that will give you an overview of certain climate factors on given locations and create warnings when thresholds are exceeded.
The purpose is to monitor the indoor climate on different locations and create an fast and easy overview over in which locations the client need to interact with the indoor climate to avoid costly errors like excessive heating bills or damages like mold._

## How does it work?
The KlimaKontrol is a web solution which is currently a minimum viable product for demo purposes. 
It consist of two user flows:
1. DataCollecting Users: A number of users who will upload data points from data collector devices on a given location. Future: IOT devices uploading live data from locations.
2. Monitoring/Managing Users: A few selected users whose purpose is to have the overview of all locations and act upon monitoring alarms, to correct the indoor climate at a given location. 

![overview_demo](https://github.com/user-attachments/assets/1d24fd69-07c7-455c-8172-d07486b7fa17)


## How to start project

From the main folder you can the following commands with npm:

Mandatory, first install dependencies: 

* __npm run install-all__

Then run one of:
- npm run server
- npm run client

Or for both client and server simultaneously
- npm run start

