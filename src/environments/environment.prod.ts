export const environment = {
  production: true,
  auth: {
    username: 'admin',
    password: '123'
  },
  github: {
    token: 'PLACEHOLDER_GH_ACCESS_KEY', // Placeholder reemplazado en build time
    owner: 'Davix81',
    repo: 'expenses-data',
    branch: 'main',
    filePath: 'data/expenses.json',
    settingsFilePath: 'data/settings.json'
  }
};
