export const environment = {
  production: false,
  auth: {
    username: 'admin',
    password: '123'
  },
  github: {
    token: '', // Empty for public repositories
    owner: 'Davix81',
    repo: 'expenses-data',
    branch: 'main',
    filePath: 'data/expenses.json',
    settingsFilePath: 'data/settings.json'
  },
  storageConfig: '__STORAGE_CONFIG__' // Data format configuration
};
