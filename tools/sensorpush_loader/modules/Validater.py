import re

def is_valid_datetime_format(input_string):
    # Regular expression to match the format "YYYY-MM-DDTHH:MM:SS±HHMM"
    # validating pattern as: 2025-01-25T23:49:00.000Z
    pattern = r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$'
    
    # Match the input string against the regex pattern
    if re.match(pattern, input_string):
        return True
    else:
        return False