const path = require('path');
const os = require('os');

// Cross-platform configuration
const isWindows = os.platform() === 'win32';

// Base directories for data and logs
const BASE_DATA_DIR = '/opt/klimakontrol/data';
const BASE_LOG_DIR = '/opt/klimakontrol/logs';

// Service-specific directories
const SERVICE_DIRS = {
  'klima-server': {
    dataDir: path.join(BASE_DATA_DIR, 'klima-server'),
    logDir: path.join(BASE_LOG_DIR, 'klima-server')
  },
  'klima-ngrok': {
    dataDir: null, // ngrok doesn't need data directory
    logDir: path.join(BASE_LOG_DIR, 'klima-ngrok')
  },
  'data-provider': {
    dataDir: path.join(BASE_DATA_DIR, 'data-provider'),
    logDir: path.join(BASE_LOG_DIR, 'data-provider')
  }
};

// Python interpreter path
const pythonInterpreter = isWindows 
  ? path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'Scripts', 'python.exe')
  : path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'bin', 'python');

module.exports = {
  apps: [
    {
      name: 'klima-server',
      script: path.resolve(__dirname, 'start_server.sh'),
      interpreter: 'bash',
      cwd: path.resolve(__dirname),
      watch: false,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
        REFRESH_TOKEN_SECRET: 'your-refresh-token-secret-change-this-in-production',
        CORS_ORIGINS: 'https://klima-kontrol-five.vercel.app,http://localhost:3000,http://localhost:5173,http://localhost:4173',
        DATA_DIR: SERVICE_DIRS['klima-server'].dataDir,
        LOG_DIR: SERVICE_DIRS['klima-server'].logDir
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATA_DIR: SERVICE_DIRS['klima-server'].dataDir,
        LOG_DIR: SERVICE_DIRS['klima-server'].logDir
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATA_DIR: SERVICE_DIRS['klima-server'].dataDir,
        LOG_DIR: SERVICE_DIRS['klima-server'].logDir
      },
      error_file: path.join(SERVICE_DIRS['klima-server'].logDir, 'error.log'),
      out_file: path.join(SERVICE_DIRS['klima-server'].logDir, 'out.log'),
      log_file: path.join(SERVICE_DIRS['klima-server'].logDir, 'combined.log'),
      time: true
    },
    {
      name: 'klima-ngrok',
      script: path.resolve(__dirname, 'start_ngrok.sh'),
      interpreter: 'bash',
      cwd: path.resolve(__dirname),
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: path.join(SERVICE_DIRS['klima-ngrok'].logDir, 'error.log'),
      out_file: path.join(SERVICE_DIRS['klima-ngrok'].logDir, 'out.log'),
      log_file: path.join(SERVICE_DIRS['klima-ngrok'].logDir, 'combined.log'),
      time: true
    },
    {
      name: 'data-provider',
      script: path.resolve(__dirname, 'tools-submodule', 'data_provider', 'main.py'),
      interpreter: path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'bin', 'python'),
      cwd: path.resolve(__dirname, 'tools-submodule', 'data_provider'),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PYTHONPATH: path.resolve(__dirname, 'tools-submodule', 'data_provider'),
        VIRTUAL_ENV: path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv'),
        DATA_DIR: SERVICE_DIRS['data-provider'].dataDir,
        LOG_DIR: SERVICE_DIRS['data-provider'].logDir,
        PATH: isWindows 
          ? `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'Scripts')};${process.env.PATH}`
          : `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'bin')}:${process.env.PATH}`
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO',
        PYTHONPATH: path.resolve(__dirname, 'tools-submodule', 'data_provider'),
        VIRTUAL_ENV: path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv'),
        DATA_DIR: SERVICE_DIRS['data-provider'].dataDir,
        LOG_DIR: SERVICE_DIRS['data-provider'].logDir,
        PATH: isWindows 
          ? `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'Scripts')};${process.env.PATH}`
          : `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'bin')}:${process.env.PATH}`
      },
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'DEBUG',
        PYTHONPATH: path.resolve(__dirname, 'tools-submodule', 'data_provider'),
        VIRTUAL_ENV: path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv'),
        DATA_DIR: SERVICE_DIRS['data-provider'].dataDir,
        LOG_DIR: SERVICE_DIRS['data-provider'].logDir,
        PATH: isWindows 
          ? `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'Scripts')};${process.env.PATH}`
          : `${path.resolve(__dirname, 'tools-submodule', 'data_provider', 'venv', 'bin')}:${process.env.PATH}`
      },
      log_file: path.join(SERVICE_DIRS['data-provider'].logDir, 'combined.log'),
      out_file: path.join(SERVICE_DIRS['data-provider'].logDir, 'out.log'),
      error_file: path.join(SERVICE_DIRS['data-provider'].logDir, 'error.log'),
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
      'post-deploy': [
        'git submodule update --init --recursive',
        'cd server && npm install',
        `mkdir -p ${BASE_DATA_DIR} ${BASE_LOG_DIR}`,
        `mkdir -p ${SERVICE_DIRS['klima-server'].dataDir} ${SERVICE_DIRS['klima-server'].logDir}`,
        `mkdir -p ${SERVICE_DIRS['klima-ngrok'].logDir}`,
        `mkdir -p ${SERVICE_DIRS['data-provider'].dataDir} ${SERVICE_DIRS['data-provider'].logDir}`,
        'pm2 reload ecosystem.config.js --env production'
      ].join(' && '),
      'pre-setup': ''
    }
  }
};
