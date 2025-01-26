import json

def pritty_print_json(input_data: str):
    pretty_json = json.dumps(input_data, indent=4)
    print(pretty_json)