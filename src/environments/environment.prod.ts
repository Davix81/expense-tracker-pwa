export const environment = {
  production: true,
  auth: {
    username: 'admin',
    password: '123'
  },
  github: {
    token: '__GITHUB_TOKEN__', // Placeholder reemplazado en build time
    owner: 'Davix81',
    repo: 'expenses-data',
    branch: 'main',
    filePath: 'data/expenses.json',
    settingsFilePath: 'data/settings.json'
  }
};
