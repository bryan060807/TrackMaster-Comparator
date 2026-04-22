module.exports = {
  apps: [
    {
      name: 'trackmaster-comparator',
      cwd: __dirname,
      script: './server/static-server.mjs',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: '8081',
      },
    },
  ],
};
