export const environment = {
  production: false,
  // API Backend (Vercel)
  apiUrl: 'http://localhost:3000/api', // Local development
  apiSecret: 'dev-secret-key',
  // Storage configuration is now provided by user at login
  storageConfig: '', // Not used anymore - user provides encryption key at login
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
