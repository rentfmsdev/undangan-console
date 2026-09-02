/**
 * PM2 Production Ecosystem Configuration
 * Manages Next.js Web Server and Node.js WebSocket Collaboration Daemon.
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 reload ecosystem.config.cjs
 *   pm2 stop ecosystem.config.cjs
 *   pm2 logs
 */

module.exports = {
  apps: [
    {
      name: "undangan-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/web-error.log",
      out_file: "logs/web-out.log",
      combine_logs: true,
    },
    {
      name: "undangan-collab",
      script: "server/collab-server.mjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      // Allow up to 8 seconds for graceful snapshot flushing before SIGKILL
      kill_timeout: 8000,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        COLLAB_PORT: 3001,
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/collab-error.log",
      out_file: "logs/collab-out.log",
      combine_logs: true,
    },
  ],
};
