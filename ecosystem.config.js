const path = require('path');
const os = require('os');

// Cross-platform configuration
const isWindows = os.platform() === 'win32';
const pythonInterpreter = isWindows 
  ? path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'Scripts', 'python.exe')
  : path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'bin', 'python');

module.exports = {
  apps: [
    {
      name: 'klima-server',
      script: 'npm',
      args: 'run start',
      cwd: '/home/chris/projects/KlimaKontrol/server',
      watch: false,
      exec_mode: 'fork',
      interpreter: 'none',
      pre_start: [
        'cd /home/chris/projects/KlimaKontrol/server',
        'npm install'
      ].join(' && '),
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
        REFRESH_TOKEN_SECRET: 'your-refresh-token-secret-change-this-in-production',
        CORS_ORIGINS: 'https://klima-kontrol-five.vercel.app,http://localhost:3000,http://localhost:5173,http://localhost:4173',
        DATA_DIR: '/opt/klimakontrol/data/klima-server',
        LOG_DIR: '/opt/klimakontrol/logs/klima-server'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATA_DIR: '/opt/klimakontrol/data/klima-server',
        LOG_DIR: '/opt/klimakontrol/logs/klima-server'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATA_DIR: '/opt/klimakontrol/data/klima-server',
        LOG_DIR: '/opt/klimakontrol/logs/klima-server'
      },
      error_file: '/opt/klimakontrol/logs/klima-server/error.log',
      out_file: '/opt/klimakontrol/logs/klima-server/out.log',
      log_file: '/opt/klimakontrol/logs/klima-server/combined.log',
      time: true
    },
    {
      name: 'klima-ngrok',
      script: 'ngrok',
      args: 'http --domain=possible-key-bluebird.ngrok-free.app 5001',
      exec_mode: 'fork',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/opt/klimakontrol/logs/klima-ngrok/error.log',
      out_file: '/opt/klimakontrol/logs/klima-ngrok/out.log',
      log_file: '/opt/klimakontrol/logs/klima-ngrok/combined.log',
      time: true
    },
    {
      name: 'data-provider',
      script: path.resolve(__dirname, 'tools-submodule', 'data_provider', 'main.py'),
      interpreter: pythonInterpreter,
      cwd: path.resolve(__dirname, 'tools-submodule', 'data_provider'),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PYTHONPATH: path.resolve(__dirname, 'tools-submodule', 'data_provider'),
        VIRTUAL_ENV: path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv'),
        DATA_DIR: '/opt/klimakontrol/data/data-provider',
        LOG_DIR: '/opt/klimakontrol/logs/data-provider',
        PATH: isWindows 
          ? `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'Scripts')};${process.env.PATH}`
          : `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'bin')}:${process.env.PATH}`
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO',
        PYTHONPATH: path.resolve(__dirname, 'tools-submodule', 'data_provider'),
        VIRTUAL_ENV: path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv'),
        DATA_DIR: '/opt/klimakontrol/data/data-provider',
        LOG_DIR: '/opt/klimakontrol/logs/data-provider',
        PATH: isWindows 
          ? `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'Scripts')};${process.env.PATH}`
          : `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'bin')}:${process.env.PATH}`
      },
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'DEBUG',
        PYTHONPATH: path.resolve(__dirname, 'tools-submodule', 'data_provider'),
        VIRTUAL_ENV: path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv'),
        DATA_DIR: '/opt/klimakontrol/data/data-provider',
        LOG_DIR: '/opt/klimakontrol/logs/data-provider',
        PATH: isWindows 
          ? `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'Scripts')};${process.env.PATH}`
          : `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'bin')}:${process.env.PATH}`
      },
      log_file: '/opt/klimakontrol/logs/data-provider/combined.log',
      out_file: '/opt/klimakontrol/logs/data-provider/out.log',
      error_file: '/opt/klimakontrol/logs/data-provider/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      
      // Restart policy
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ],

  deploy: {
    production: {
      user: 'chris',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'your-git-repo-url',
      path: '/home/chris/projects/KlimaKontrol',
      'pre-deploy-local': '',
      'post-deploy': 'git submodule update --init --recursive && cd server && npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
