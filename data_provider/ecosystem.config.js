module.exports = {
  apps: [{
    name: 'data-provider',
    script: 'main.py',
    interpreter: 'python3',
    cwd: '/path/to/data_provider',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PYTHONPATH: '/path/to/data_provider'
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true,
    
    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Resource limits
    max_memory_restart: '512M',
    
    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'INFO'
    },
    env_development: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'DEBUG'
    }
  }]
};
