module.exports = {
  apps: [
    {
      name: 'agents-manager',
      script: './tools/agents/manager.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'php-analyzer',
      script: './tools/agents/php-analyzer/index.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'dev-generator',
      script: './tools/agents/dev-generator/index.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
    },
    {
      name: 'sql-mapper',
      script: './tools/agents/sql-mapper/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'docs-writer',
      script: './tools/agents/docs-writer/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
    {
      name: 'migration-dashboard',
      script: './dashboard/index.js',
      instances: 1,
      autorestart: true,
      watch: ['./dashboard'],
      max_memory_restart: '500M',
    }
  ],
};
