export const environment = {
  production: true,
  // API Backend (Vercel)
  apiUrl: '__API_URL__', // Will be replaced during build
  apiSecret: '__API_SECRET__', // Will be replaced during build
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
