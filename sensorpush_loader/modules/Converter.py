def fahrenheit_to_celsius(fahrenheit):
    celsius = (fahrenheit - 32) * 5 / 9
    return celsius

def celsius_to_fahrenheit(celsius):
    fahrenheit = (celsius * 9 / 5) + 32
    return fahrenheit

def pressure_inhg_to_hpa(inhg):
    """
    Convert barometric pressure from inches of mercury (inHg) to hectopascals (hPa).
    
    Parameters:
        inhg (float): Pressure in inches of mercury.
        
    Returns:
        float: Pressure in hectopascals.
    """
    hpa = inhg * 33.8638867
    return hpa

