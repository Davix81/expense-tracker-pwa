# Expense Tracker PWA

A Progressive Web App (PWA) built with Angular for managing domestic recurring expenses. The application uses GitHub as a persistence layer, supports offline functionality, and provides a responsive Material Design interface.

## Features

- **User Authentication**: Simple username/password authentication with session management
- **Dashboard**: Visual analytics with charts showing expense trends and upcoming payments
- **Expense Management**: Create, view, sort, and filter recurring expenses
- **GitHub Storage**: Store expense data in a private GitHub repository as JSON
- **Progressive Web App**: Installable on devices with offline support
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices
- **Material Design**: Clean, modern UI using Angular Material components
- **Offline Support**: Service worker caching for offline access

## Dashboard Features

The dashboard provides visual insights into your expenses:

- **Next Payment Counter**: Shows the next upcoming payment with a countdown in days
- **Monthly Chart**: Bar chart displaying expenses for the last 6 months
- **Annual Trend**: Line chart showing expense trends over the last 12 months
- **Category Breakdown**: Doughnut chart showing expenses distributed by category

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **Angular CLI**: Version 17.x or higher
  ```bash
  npm install -g @angular/cli
  ```
- **GitHub Account**: For data persistence
- **GitHub Personal Access Token**: With `repo` scope ([Create token](https://github.com/settings/tokens))

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-tracker-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure GitHub Storage**
   
   Create a private GitHub repository for storing expense data:
   - Repository name: `expense-data` (or your preferred name)
   - Create the file structure: `data/expenses.json`
   - Initialize `expenses.json` with an empty array: `[]`

4. **Configure Environment**
   
   Update `src/environments/environment.ts` with your credentials:
   ```typescript
   export const environment = {
     production: false,
     auth: {
       username: 'your-username',
       password: 'your-password'
     },
     github: {
       token: 'ghp_YOUR_GITHUB_TOKEN',
       owner: 'your-github-username',
       repo: 'expense-data',
       branch: 'main',
       filePath: 'data/expenses.json'
     }
   };
   ```

   **Security Note**: Never commit your GitHub token to version control. Add `environment.ts` to `.gitignore` or use environment variables in production.

## Development Server

To start the development server:

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload when you make changes to source files.

## Build

### Development Build

```bash
ng build
```

### Production Build

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory. The production build includes:
- Minification and optimization
- Service worker for PWA functionality
- Ahead-of-Time (AOT) compilation

## PWA Testing

To test PWA features (offline support, installation):

1. **Build the production version**
   ```bash
   ng build --configuration production
   ```

2. **Serve the production build**
   
   Install a simple HTTP server if you don't have one:
   ```bash
   npm install -g http-server
   ```

   Serve the built application:
   ```bash
   http-server -p 8080 -c-1 dist/expense-tracker-pwa/browser
   ```

3. **Test PWA features**
   - Open `http://localhost:8080` in your browser
   - Check for the install prompt (desktop) or "Add to Home Screen" (mobile)
   - Test offline functionality by disconnecting from the network
   - Use Chrome DevTools > Application > Service Workers to inspect caching

4. **Lighthouse Testing**
   
   Run Lighthouse in Chrome DevTools to verify PWA score:
   - Open Chrome DevTools (F12)
   - Go to "Lighthouse" tab
   - Select "Progressive Web App" category
   - Click "Analyze page load"
   - Target score: >90

## Running Tests

### Unit Tests

Execute unit tests using Vitest:

```bash
ng test
```

### Property-Based Tests

The project includes property-based tests using fast-check. Run all tests including property tests:

```bash
npm test
```

## Project Structure

```
expense-tracker-pwa/
├── src/
│   ├── app/
│   │   ├── components/          # UI components
│   │   │   ├── login-page/
│   │   │   ├── dashboard-page/
│   │   │   ├── expense-list-page/
│   │   │   ├── expense-table/
│   │   │   └── add-expense-dialog/
│   │   ├── services/            # Business logic services
│   │   │   ├── auth.service.ts
│   │   │   ├── expense.service.ts
│   │   │   └── github-storage.service.ts
│   │   ├── guards/              # Route guards
│   │   │   └── auth.guard.ts
│   │   └── models/              # Data models
│   │       └── expense.model.ts
│   ├── environments/            # Environment configuration
│   └── assets/                  # Static assets
├── public/
│   ├── icons/                   # PWA icons
│   └── manifest.webmanifest     # PWA manifest
└── ngsw-config.json            # Service worker configuration
```

## Usage

### Login

1. Navigate to the application
2. Enter your configured username and password
3. Click "Login"
4. You'll be redirected to the Dashboard

### Dashboard

The dashboard is the main landing page after login and provides:

- **Next Payment Card**: Displays the next upcoming payment with:
  - Expense name and amount
  - Scheduled payment date
  - Countdown in days until payment is due
  
- **Monthly Expenses Chart**: Bar chart showing total expenses for the last 6 months

- **Annual Trend Chart**: Line chart displaying expense trends over the last 12 months

- **Category Distribution**: Doughnut chart showing how expenses are distributed across categories

- **Navigation**: Click "Ver Lista Completa" to go to the detailed expense list

### Managing Expenses

- **View Expenses**: Click "Ver Lista Completa" from the dashboard or navigate to the expenses page
- **Sort**: Click column headers to sort by that column
- **Filter**: Use the filter input to search expenses
- **Add Expense**: Click the floating action button (+) to open the add expense dialog
- **Return to Dashboard**: Click the "Dashboard" button in the header
- **Logout**: Click the logout button in the header

### Expense Fields

- **Name**: Display name for the expense
- **Description**: Detailed description
- **Issuer**: Who issues the bill
- **Tag**: Custom tag for grouping
- **Category**: Expense category
- **Approximate Amount**: Expected payment amount
- **Scheduled Payment Date**: When payment is due
- **Actual Payment Date**: When actually paid (optional)
- **Actual Amount**: Actual amount paid (optional)
- **Payment Status**: PENDING, PAID, or FAILED
- **Bank**: Bank used for payment

## Configuration

### Authentication

Configure credentials in `src/environments/environment.ts`:

```typescript
auth: {
  username: 'your-username',
  password: 'your-password'
}
```

### GitHub Storage

Configure GitHub settings in `src/environments/environment.ts`:

```typescript
github: {
  token: 'ghp_YOUR_TOKEN',      // Personal Access Token with 'repo' scope
  owner: 'your-username',        // Repository owner
  repo: 'expense-data',          // Repository name
  branch: 'main',                // Branch name
  filePath: 'data/expenses.json' // Path to data file
}
```

### Creating a GitHub Personal Access Token

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Expense Tracker PWA")
4. Select the `repo` scope (full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't be able to see it again)

## Deployment

The application can be deployed to various static hosting platforms:

### GitHub Pages

```bash
ng build --configuration production --base-href /expense-tracker-pwa/
# Deploy dist/ folder to gh-pages branch
```

### Netlify

1. Connect your repository to Netlify
2. Build command: `ng build --configuration production`
3. Publish directory: `dist/expense-tracker-pwa/browser`

### Vercel

```bash
vercel --prod
```

### Firebase Hosting

```bash
ng build --configuration production
firebase deploy
```

All platforms support HTTPS and custom domains, which are required for PWA functionality.

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 13+
- Chrome Mobile: Latest version

## Troubleshooting

### GitHub API Errors

**401/403 Authentication Failed**
- Verify your GitHub token is correct
- Ensure the token has `repo` scope (full control of private repositories)
- Check that the token hasn't expired
- **Test your token**: Run `EXPENSES_DATA_TOKEN=your_token node scripts/test-token.js`
- For GitHub Actions deployment, verify the secret `EXPENSES_DATA_TOKEN` is set correctly

**Testing Token Locally**
```bash
# Windows (CMD)
set EXPENSES_DATA_TOKEN=your_token_here
node scripts/test-token.js

# Windows (PowerShell)
$env:EXPENSES_DATA_TOKEN="your_token_here"
node scripts/test-token.js

# Linux/Mac
EXPENSES_DATA_TOKEN=your_token_here node scripts/test-token.js
```

**GitHub Actions Deployment Issues**
- Check workflow logs for "Token injected successfully" message
- Verify `EXPENSES_DATA_TOKEN` secret exists in repository Settings > Secrets
- Ensure the token has access to the `expenses-data` repository
- See `TOKEN-SETUP.md` for detailed token configuration guide

**404 Not Found**
- Verify the repository owner, name, and branch are correct
- Ensure the `data/expenses.json` file exists in your repository
- Check that the repository is accessible with your token

**409 Conflict**
- The application automatically retries with the latest file SHA
- If persists, refresh the page and try again

**429 Rate Limit**
- GitHub API has rate limits (5000 requests/hour for authenticated users)
- Wait for the rate limit to reset
- Consider caching data locally to reduce API calls

### Service Worker Issues

**Changes not appearing after update**
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Clear service worker: DevTools > Application > Service Workers > Unregister
- Clear cache: DevTools > Application > Storage > Clear site data

### Login Issues

**Invalid credentials**
- Check `src/environments/environment.ts` for correct username/password
- Ensure you're using the development environment configuration

## License

This project is licensed under the MIT License.

## Additional Resources

- [Angular Documentation](https://angular.dev)
- [Angular Material](https://material.angular.io)
- [Angular PWA Guide](https://angular.dev/ecosystem/service-workers)
- [GitHub REST API](https://docs.github.com/en/rest)
