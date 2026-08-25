module.exports = {
  apps: [
    {
      name: 'portofolio-backend',
      cwd: './backend',
      script: './portfolio-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '250M',
      env: {
        APP_ENV: 'production',
        APP_PORT: '8080',
      },
    },
    {
      name: 'portofolio-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
};
