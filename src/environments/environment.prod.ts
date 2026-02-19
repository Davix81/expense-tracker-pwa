export const environment = {
  production: true,
  auth: {
    username: 'admin',
    password: '123'
  },
  github: {
    token: 'EXPENSES_REPO_ACCESS_TOKEN', // Placeholder reemplazado en build time
    owner: 'Davix81',
    repo: 'expenses-data',
    branch: 'main',
    filePath: 'data/expenses.json',
    settingsFilePath: 'data/settings.json'
  }
};
