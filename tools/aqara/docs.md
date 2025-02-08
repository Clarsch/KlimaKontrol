# Aqara
## API 

### Europe Server
open-ger.aqara.com 

### Request format
https://${domain}/v3.0/open/api


# Request Parameter

## Request Header Parameter

**Note:** Request header must contain the below required parameters.

| Name      | Type   | Is Required? | Description                                        |
|-----------|--------|--------------|----------------------------------------------------|
| accesstoken | String | No           | Access Token obtained through authorization          |
| appid    | String | Yes          | App ID of the third-party application               |
| keyid    | String | Yes          | App Key corresponding to Key ID                     |
| nonce    | String | Yes          | Random string, different for every request          |
| time     | String | Yes          | Request timestamp, in milliseconds                  |
| sign     | String | Yes          | Request signature                                   |
| lang     | Enum   | No           | Language; the default is `en`. Options: `zh`, `en` |

## Fixed Request Parameters

| Name    | Type   | Is Required? | Description                                       |
|---------|--------|--------------|---------------------------------------------------|
| intent  | String | Yes          | Request intent                                    |
| data    | Object | Yes          | Request data; see API Documentation for detail.  |

## Fixed Response Parameters

| Name      | Type   | Is Required? | Description                                        |
|-----------|--------|--------------|----------------------------------------------------|
| code      | int    | Yes          | Return code. 0: success; please see Error Code for detail. |
| requestId | String | Yes          | Request ID                                        |
| message   | String | Yes          | Return code message                               |
| result    | Object | No           | Response data; see API Documentation for detail.  |
