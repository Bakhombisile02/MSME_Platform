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
    }
    // CMS is served directly by Nginx from /var/www/msme/MSME-CMS-Frontend/dist/
    // No PM2 process needed - just run: npm run build in MSME-CMS-Frontend
  ]
};
