import logging
import os


class Logger:
    def __init__(self, name='app_logger', log_file='app.log', level=logging.DEBUG):
        """Initialize the Logger.

        Args:
            name (str): Name of the logger.
            log_file (str): The log file path.
            level (int): Logging level.
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        self.console_output_enabled = False

        # Create a file handler
        if not os.path.exists(os.path.dirname(log_file)):
            os.makedirs(os.path.dirname(log_file))
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(level)

        # Create a console handler
        self.console_handler = logging.StreamHandler()
        self.console_handler.setLevel(logging.INFO) # Concole logging for debug is not enabled by default

        # Create a formatter
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        self.console_handler.setFormatter(formatter)

        # Add the handlers to the logger
        self.logger.addHandler(file_handler)
        self.logger.addHandler(self.console_handler)

    def debug(self, caller_name, message):
        """Log a message with DEBUG level."""
        self.logger.debug(f"{caller_name}: {message}")

    def info(self, caller_name, message):
        """Log a message with INFO level."""
        self.logger.info(f"{caller_name}: {message}")

    def warning(self,caller_name,  message):
        """Log a message with WARNING level."""
        self.logger.warning(f"{caller_name}: {message}")

    def error(self, caller_name, message):
        """Log a message with ERROR level."""
        self.logger.error(f"{caller_name}: {message}")

    def critical(self, caller_name, message):
        """Log a message with CRITICAL level."""
        self.logger.critical(f"{caller_name}: {message}")

    def disable_console_debug_output(self):
        self.console_handler.setLevel(logging.INFO)
    
    def enable_console_debug_output(self):
        self.console_handler.setLevel(logging.DEBUG)



    def logger_console_settings(self):
        TAG = "LOGGER"
        print("\nWelcome to the LOGGER settings:")
        help_desc = "  help     -> Show the options again\n"
        exit_desc = "  exit     -> Exit the logger settings\n"
        test_desc = "  test     -> Writes a DEBUG log in console if enabled\n"
        enab_desc = "  enable   -> Enables the logger Console output\n"
        disa_desc = "  disable  -> Disables the logger Console output\n"
        options = f"Options:\n{help_desc}{exit_desc}{test_desc}{enab_desc}{disa_desc}"
        print(options)

        while True:
            action = input("Select option: ").strip()
            if action == "exit":
                return
            elif action == 'help' or action == '-h':
                print(options)
            elif action == 'test':
                self.debug(TAG, "This is a TEST DEBUG Log statement...")
            elif action == 'enable':
                self.enable_console_debug_output()
                self.debug(TAG, "DEBUG Console logging ENABLED")
            elif action == 'disable':
                self.disable_console_debug_output()
                self.info(TAG, "DEBUG Console logging DISABLED")

