/**
 * PM2 Ecosystem Configuration
 * Production deployment on Hetzner VPS
 */

module.exports = {
  apps: [
    {
      name: 'seacalendar-web',
      script: 'web-next/.next/standalone/server.js',
      cwd: '/opt/seacalendar',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/opt/seacalendar/logs/web-error.log',
      out_file: '/opt/seacalendar/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
    {
      name: 'seacalendar-bot',
      script: 'discord-bot/dist/bot.js',
      cwd: '/opt/seacalendar',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/opt/seacalendar/logs/bot-error.log',
      out_file: '/opt/seacalendar/logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
    },
  ],
};
