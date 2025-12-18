module.exports = {
  apps: [
    {
      name: "leadtrack-nurturing-cron",
      script: "cron.js",
      cwd: "/home/agile/apps/leadtrack/nurturing-cron",
      env: {
        NODE_ENV: "production",
        NURTURING_CRON_KEY:
          "bQ7xK2VzNA4pGmL8eYtS9rHd5UfCiWwXoJ1qZk0DsBhRvTuFnP3yMlEa",
      },
      restart_delay: 5000,
    },
  ],
};
