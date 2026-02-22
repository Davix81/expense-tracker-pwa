export const environment = {
  production: false,
  auth: {
    username: 'admin',
    password: '123'
  },
  // API Backend (Vercel)
  apiUrl: 'http://localhost:3000/api', // Local development
  apiSecret: '__API_SECRET__', // Will be replaced during build
  // Storage configuration for encryption
  storageConfig: '__STORAGE_CONFIG__' // Data format configuration
};
