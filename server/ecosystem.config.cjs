// PM2 process file for the API on EC2:  pm2 start ecosystem.config.cjs
// The API reads its settings from server/.env (loaded by the app itself), so only NODE_ENV is set here.
module.exports = {
  apps: [
    {
      name: "wcs-api",
      script: "dist/server.js",
      cwd: __dirname,
      instances: 1, // keep 1: the 5-minute unpaid-order clean-up job runs inside the process and rate limits are kept in memory
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "400M",
      kill_timeout: 10000, // the server closes connections and MongoDB on SIGTERM
      env: { NODE_ENV: "production" },
    },
  ],
};
