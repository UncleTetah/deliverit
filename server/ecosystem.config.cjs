module.exports = {
  apps: [
    {
      name: 'deliverit-api',
      script: 'src/server.js',
      cwd: __dirname,
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs', '.env'],
      watch_options: {
        followSymlinks: false,
      },
      env: {
        NODE_ENV: 'development',
      },
      max_restarts: 10,
      restart_delay: 2000,
      autorestart: true,
      exp_backoff_restart_delay: 100,
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      time: true,
    },
  ],
};