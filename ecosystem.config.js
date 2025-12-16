module.exports = {
  apps: [
    {
      name: 'msme-backend',
      cwd: './MSME-Backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'msme-website',
      cwd: './MSME-Website-Frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'msme-cms',
      cwd: './MSME-CMS-Frontend',
      script: 'npx',
      args: 'serve -s dist -l 5173',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5173
      }
    }
  ]
};
