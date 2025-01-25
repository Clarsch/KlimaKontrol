# Bluetooth API — SensorPush

## Bluetooth Protocol for 2nd Generation Sensor Devices

### Before you start…
**Important note:** Most of our sensor devices have an open protocol which allows you to programmatically extract a sensor’s current conditions via Bluetooth. The only sensor device that does not have this open protocol is the HT1 model sensor because it is a first-generation sensor.

### General Information
The sensor devices communicate via Bluetooth Low Energy, also known as BLE or Bluetooth 4.x. On iOS the system-provided SDK is CoreBluetooth, while on Android, BluetoothGatt can be used. On Linux systems, the nodejs library noble is a good option. Similar libraries are commonly available for other development environments.

### Initial Exploration
For initial exploration of the system, we recommend using a generic BLE development tool such as LightBlue, which is freely available for iOS and Android. On Mac OS X, we use the tool Bluetility for convenient access via the desktop.

For a quick test in LightBlue on a mobile device, install and open the LightBlue app. With a SensorPush 2nd generation device nearby with an installed battery, you should see it in the list, identified by a name like “SensorPush HTP F6D6”. Tap it in the list to connect to it. 

You’ll then see an enumeration of the available services and characteristics (these terms are explained in the next section of this document). Find the characteristic starting with 0xEF090080 and tap it. This is the Read Temperature characteristic.

In the screen that appears, tap “Write new value.” Enter the value 01000000 and tap Done. This tells the SensorPush device to read the temperature and update this characteristic with the new temperature value.

Once you’re returned back to the previous screen, in the upper section “READ VALUES” you should see the new hex value in the top of the list. It is in little-endian format with the least significant bytes first, so if you see 0xB2070000, that is reversed to 0x000007B2 which translates to the decimal value 1970. Divide this by 100 to get degrees Celsius: 19.70.

You can also use the button in the top right corner of the LightBlue app to have it perform the hex to decimal conversion for you. Just select the “4 Byte Signed Int Little Endian” option.

In order to read the value again, you can just tap the value 0x01000000 in the WRITTEN VALUES list and it will trigger another read and show you the updated value.

### BLE and GATT Concepts
A thorough explanation of BLE and GATT is beyond the scope of this document, however, the essential concepts for SensorPush 2nd generation device access are as follows:

- **Client / Master:** The device you are using to access the sensor (mobile device, desktop computer, etc)
- **Server / Peripheral:** The SensorPush sensor
- **Service:** Once connected to the device, the service is the top-level in the device access hierarchy. The SensorPush devices provide two services. One is the service to be used to configure the device and access data. The second service is for internal use only and is not used for data access.
- **Characteristic:** Services contain one or more characteristics, which provide access to the various data components and configuration parameters. The essential characteristics of the primary SensorPush service will be documented below.

### The SensorPush GATT Service and its Essential Characteristics
**NOTE:** All multi-byte values are interpreted in little-endian format, with the least significant byte read and written first. 

- **Characteristic: EF090008-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** RESERVED
   
- **Characteristic: EF090009-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** RESERVED
    
- **Characteristic: EF09000A-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** RESERVED
    
- **Characteristic: EF09000B-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** RESERVED
    
- **Characteristic: EF09000C-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** LED Control
    - **Size:** 1 byte
    - **Type:** uint8
    - **Permissions:** Read/write
    - **Description:** Controls the LED on the front of the device as follows (e.g., for confirming device identification/function):
        - 0: LED off
        - 1 - 127: will blink the LED the specified number of times, once per second.
        - 128: will blink the LED once per second, indefinitely

- **Characteristic: EF09000D-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** MAC Address
    - **Size:** 6 bytes
    - **Type:** uint8[6]
    - **Permissions:** Read-only
    - **Description:** The device’s Bluetooth MAC address.

- **Characteristic: EF090080-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** Read Temperature
    - **Size:** 4 bytes
    - **Type:** int32
    - **Permissions:** Read/write
    - **Description:** Allows read of the current temperature. To read data, write any 32-bit value to the characteristic (e.g., 0x01000000). This triggers a sensor read. Once the read is complete (typically less than 100ms later), the data will be available to read, in hundredths of degrees Celsius (e.g. 21.34 degrees C will read 2134). This read will also populate the relative humidity data, so if desired, it can be read immediately after without the need for a separate read command.

- **Characteristic: EF090081-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** Read Relative Humidity
    - **Size:** 4 bytes
    - **Type:** int32
    - **Permissions:** Read/write
    - **Description:** Allows read of the current relative humidity. To read data, write any 32-bit value to the characteristic (e.g., 0x01000000). This triggers a sensor read. Once the read is complete (typically less than 100ms later), the data will be available to read, in hundredths of percent relative humidity (e.g., 21.34% will read 2134). 

- **Characteristic: EF090082-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** Read Barometric Pressure
    - **Size:** 4 bytes
    - **Type:** int32
    - **Permissions:** Read/write
    - **Description:** Allows read of the current barometric pressure. To read data, write any 32-bit value to the characteristic (e.g., 0x01000000). This triggers a sensor read. Once the read is complete (typically less than 100ms later), the data will be available to read, in hundredths of Pascals (e.g., 97813.64Pa will read 9781364). Note that this is station pressure, uncorrected for altitude.

### Service: F000FFC0-0451-4000-B000-000000000000
*Internal Use Only*

### Service: EF090000-11D6-42BA-93B8-9DD7EC090AB0

- **Characteristic: EF090001-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** Device ID
    - **Size:** 4 bytes
    - **Type:** uint32
    - **Permissions:** Read-only
    - **Description:** A unique numeric device ID for the sensor.

- **Characteristic: EF090002-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** Device Version
    - **Size:** 7 bytes
    - **Type:** uint8[7]
    - **Permissions:** Read-only
    - **Description:**
        - deviceVersion[0]: Model Identifier 
        - deviceVersion[1-6]: Detailed version information (Unnecessary at this time).

- **Characteristic: EF090003-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** Tx Power
    - **Size:** 1 byte
    - **Type:** uint8
    - **Permissions:** Read/Write
    - **Description:** Allows configuration of the device’s RF transmit power. Larger values will increase range at the expense of battery life.

- **Characteristic: EF090004-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** RESERVED

- **Characteristic: EF090005-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** Advertising Interval
    - **Size:** 1 byte
    - **Type:** uint8
    - **Permissions:** Read/Write
    - **Description:** Sets the advertising interval of the device, in units of 625 microseconds.

- **Characteristic: EF090007-11D6-42BA-93B8-9DD7EC090AA9**
    - **Data:** Battery Voltage
    - **Size:** 4 bytes
    - **Type:** int16[2]
    - **Permissions:** Read-only
    - **Description:** 
        - batteryVoltage[0]: Battery voltage in mV. 
        - batteryVoltage[1]: The temperature in degrees C at the time of the last battery voltage reading.
