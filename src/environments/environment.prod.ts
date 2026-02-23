export const environment = {
  production: true,
  auth: {
    username: 'admin',
    password: '123'
  },
  // API Backend (Vercel)
  apiUrl: '__API_URL__', // Will be replaced during build
  apiSecret: '__API_SECRET__', // Will be replaced during build
  // Storage configuration for encryption
  storageConfig: '__STORAGE_CONFIG__', // Data format configuration
  // GitHub configuration (legacy, kept for test compatibility)
  github: {
    owner: '',
    repo: '',
    branch: 'main',
    filePath: 'expenses.json',
    settingsFilePath: 'settings.json',
    token: ''
  }
};
