# Architecture Document

## Overview

The Expense Tracker PWA is an Angular-based Progressive Web App for managing domestic recurring expenses. The application follows a service-oriented architecture with clear separation of concerns between presentation, business logic, and data persistence layers.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────────┐     │
│  │ LoginPage│  │ExpenseListPage│  │ExpenseTableComp  │     │
│  └──────────┘  └───────────────┘  └──────────────────┘     │
│                      │                                       │
│                      └──────┐  ┌──────────────────┐         │
│                             │  │AddExpenseDialog  │         │
│                             └──┴──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │AuthService │  │ExpenseService│  │GitHubStorageServ │    │
│  └────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │AuthGuard  │  │ServiceWorker │  │localStorage      │     │
│  └───────────┘  └──────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      External Services                       │
│                    ┌──────────────┐                          │
│                    │  GitHub API  │                          │
│                    └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
AppComponent (Router Outlet)
│
├── LoginPage
│   └── Reactive Form (username, password)
│
└── ExpenseListPage (Protected by AuthGuard)
    ├── Header (with logout button)
    ├── ExpenseTableComponent
    │   ├── Filter Input
    │   ├── Material Table (sortable)
    │   └── Expense Rows
    └── AddExpenseDialog (Material Dialog)
        └── Reactive Form (all expense fields)
```

## Service Dependencies

```
┌──────────────────┐
│  ExpenseService  │
│                  │
│  - getExpenses() │
│  - addExpense()  │
│  - validate()    │
└────────┬─────────┘
         │
         │ depends on
         ▼
┌──────────────────────┐
│GitHubStorageService  │
│                      │
│  - readExpenses()    │
│  - writeExpenses()   │
│  - encodeContent()   │
│  - decodeContent()   │
└──────────────────────┘
         │
         │ uses
         ▼
┌──────────────────────┐
│    GitHub REST API   │
│                      │
│  GET /contents/...   │
│  PUT /contents/...   │
└──────────────────────┘


┌──────────────────┐
│   AuthService    │
│                  │
│  - login()       │
│  - logout()      │
│  - isAuth()      │
└────────┬─────────┘
         │
         │ uses
         ▼
┌──────────────────────┐
│    localStorage      │
│                      │
│  session token       │
└──────────────────────┘


┌──────────────────┐
│   AuthGuard      │
│                  │
│  - canActivate() │
└────────┬─────────┘
         │
         │ depends on
         ▼
┌──────────────────┐
│   AuthService    │
└──────────────────┘
```

## Data Flow

### Authentication Flow

```
1. User enters credentials
   │
   ▼
2. LoginPage.submit()
   │
   ▼
3. AuthService.login(credentials)
   │
   ├─ Validate against environment config
   │
   ├─ Generate session token
   │
   └─ Store in localStorage
   │
   ▼
4. Navigate to /expenses
   │
   ▼
5. AuthGuard.canActivate()
   │
   ├─ Check AuthService.isAuthenticated()
   │
   └─ Allow or redirect to /login
```

### Expense Loading Flow

```
1. ExpenseListPage.ngOnInit()
   │
   ▼
2. ExpenseService.getExpenses()
   │
   ▼
3. GitHubStorageService.readExpenses()
   │
   ├─ GET /repos/{owner}/{repo}/contents/{path}
   │
   ├─ Decode Base64 content
   │
   └─ Parse JSON
   │
   ▼
4. Return Observable<Expense[]>
   │
   ▼
5. ExpenseListPage updates UI
   │
   ▼
6. ExpenseTableComponent renders table
```

### Expense Creation Flow

```
1. User clicks "Add Expense" FAB
   │
   ▼
2. ExpenseListPage.openAddDialog()
   │
   ▼
3. AddExpenseDialog opens
   │
   ▼
4. User fills form and submits
   │
   ▼
5. AddExpenseDialog.submit()
   │
   ▼
6. ExpenseService.addExpense(data)
   │
   ├─ Generate UUID for id
   │
   ├─ Set createdAt timestamp
   │
   ├─ Validate expense data
   │
   └─ Call GitHubStorageService
   │
   ▼
7. GitHubStorageService.writeExpenses()
   │
   ├─ GET current file SHA
   │
   ├─ Encode expenses as Base64 JSON
   │
   ├─ PUT /repos/{owner}/{repo}/contents/{path}
   │
   └─ Handle conflicts (retry with new SHA)
   │
   ▼
8. Return Observable<Expense>
   │
   ▼
9. Dialog closes with result
   │
   ▼
10. ExpenseListPage refreshes expense list
```

## Layers and Responsibilities

### Presentation Layer

**Components**: LoginPage, ExpenseListPage, ExpenseTableComponent, AddExpenseDialog

**Responsibilities**:
- Render UI using Angular Material components
- Handle user interactions (clicks, form submissions)
- Display data from services
- Manage component-level state
- Navigate between routes
- Show loading and error states

**Key Patterns**:
- Reactive Forms for user input
- Observable subscriptions for async data
- Material Design components for consistency
- Responsive layouts for mobile/tablet/desktop

### Service Layer

**Services**: AuthService, ExpenseService, GitHubStorageService

**Responsibilities**:
- Implement business logic
- Manage application state
- Coordinate between components and external APIs
- Validate data
- Handle errors
- Transform data between layers

**Key Patterns**:
- Dependency Injection for service access
- RxJS Observables for async operations
- BehaviorSubject for state management
- Error handling with catchError operator

### Infrastructure Layer

**Components**: AuthGuard, Service Worker, localStorage

**Responsibilities**:
- Route protection and navigation guards
- Offline caching and PWA functionality
- Session persistence
- HTTP interceptors (if needed)

**Key Patterns**:
- Route guards for authentication
- Service Worker caching strategies
- Browser API wrappers

### External Services

**Services**: GitHub REST API

**Responsibilities**:
- Data persistence
- Version control for expense data
- Authentication via Personal Access Token

**Key Patterns**:
- RESTful API calls
- Base64 encoding for content
- SHA-based conflict resolution

## Key Design Patterns

### 1. Service-Oriented Architecture

All business logic is encapsulated in services, making components thin and focused on presentation.

### 2. Reactive Programming

Uses RxJS Observables throughout for async operations, enabling reactive UI updates.

### 3. Dependency Injection

Angular's DI system provides services to components, enabling loose coupling and testability.

### 4. Guard Pattern

AuthGuard protects routes, centralizing authentication logic.

### 5. Repository Pattern

GitHubStorageService acts as a repository, abstracting data persistence details.

### 6. Facade Pattern

ExpenseService provides a simplified interface to complex operations involving multiple services.

## State Management

### Component State

- Managed locally within components
- Used for UI-specific state (loading, errors, form values)

### Service State

- AuthService: Session token in localStorage
- ExpenseService: BehaviorSubject for expense list cache

### External State

- GitHub repository: Source of truth for expense data
- localStorage: Session persistence

## Security Architecture

### Authentication

- Simple username/password validation
- Session token stored in localStorage
- AuthGuard protects authenticated routes

### Authorization

- Single-user application (no role-based access)
- All authenticated users have full access

### Data Security

- GitHub Personal Access Token for API authentication
- Token stored in environment configuration (not in code)
- HTTPS required for production
- Private GitHub repository for data storage

### Input Validation

- Reactive Forms with validators
- Service-level validation before persistence
- Type safety with TypeScript strict mode

## PWA Architecture

### Service Worker

- Caches application shell (HTML, CSS, JS)
- Caches static assets (images, fonts, icons)
- Network-first strategy for GitHub API calls
- Automatic updates when new version deployed

### Offline Support

- Application shell available offline
- Previously loaded expense data cached
- Graceful degradation when offline
- Sync when connection restored

### Installability

- Web App Manifest for installation
- App icons in multiple sizes
- Standalone display mode
- Theme colors for native feel

## Error Handling Strategy

### Service Layer

- Catch HTTP errors and transform to user-friendly messages
- Retry logic for transient failures (conflicts, network)
- Return Observables with error states

### Component Layer

- Subscribe to error states from services
- Display error messages in UI
- Provide retry actions where appropriate
- Log errors for debugging

### Global Error Handler

- Angular ErrorHandler for uncaught exceptions
- Console logging in development
- Error tracking service in production (optional)

## Performance Considerations

### Lazy Loading

- Currently not implemented (small app)
- Consider for future growth

### Change Detection

- Default change detection strategy
- Consider OnPush for large lists

### Caching

- Service Worker caches static assets
- ExpenseService caches expense list
- GitHub API responses cached by Service Worker

### Bundle Size

- Angular Material tree-shaking
- Production build with minification
- Lazy load Material modules if needed

## Testing Architecture

### Unit Tests

- Services: Mock dependencies, test business logic
- Components: TestBed, mock services, test rendering
- Guards: Mock AuthService, test navigation

### Property-Based Tests

- Use fast-check library
- Test universal properties across all inputs
- Complement unit tests with broader coverage

### Integration Tests

- Test service interactions
- Test component + service integration
- Mock external APIs (GitHub)

### End-to-End Tests

- Test complete user flows
- Use Cypress or Playwright
- Test PWA functionality

## Deployment Architecture

### Build Process

```
Source Code
   │
   ▼
TypeScript Compilation
   │
   ▼
Angular Build (ng build)
   │
   ├─ Minification
   ├─ Tree-shaking
   ├─ Service Worker generation
   └─ Asset optimization
   │
   ▼
dist/ folder
   │
   ▼
Static Hosting (GitHub Pages, Netlify, Vercel, etc.)
```

### Environment Configuration

- Development: environment.ts
- Production: environment.prod.ts
- Build-time replacement via Angular CLI

### Hosting Options

- GitHub Pages (static hosting)
- Netlify (CI/CD integration)
- Vercel (zero-config deployment)
- Firebase Hosting (Google Cloud)
- AWS S3 + CloudFront (scalable)

All support HTTPS, custom domains, and PWA requirements.

## Future Architecture Considerations

### Scalability

- Add lazy loading for feature modules
- Implement virtual scrolling for large lists
- Consider IndexedDB for local caching

### Multi-User Support

- Add user management service
- Implement role-based access control
- Add per-user data isolation

### Enhanced Offline Support

- Queue failed operations for retry
- Implement background sync
- Add conflict resolution UI

### Backend Migration

- Consider dedicated backend API
- Add real-time updates with WebSockets
- Implement server-side validation

## Folder Structure

```
expense-tracker-pwa/
├── src/
│   ├── app/
│   │   ├── components/          # UI components
│   │   │   ├── login-page/
│   │   │   ├── expense-list-page/
│   │   │   ├── expense-table/
│   │   │   └── add-expense-dialog/
│   │   ├── services/            # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── expense.service.ts
│   │   │   └── github-storage.service.ts
│   │   ├── guards/              # Route protection
│   │   │   └── auth.guard.ts
│   │   ├── models/              # Data models
│   │   │   └── expense.model.ts
│   │   ├── app.component.ts     # Root component
│   │   ├── app.routes.ts        # Routing config
│   │   └── app.config.ts        # App configuration
│   ├── environments/            # Environment configs
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── assets/                  # Static assets
│   │   └── icons/
│   ├── styles.scss              # Global styles
│   ├── index.html               # App shell
│   └── main.ts                  # Bootstrap
├── public/                      # Public assets
│   ├── manifest.webmanifest     # PWA manifest
│   └── icons/                   # App icons
├── ngsw-config.json             # Service Worker config
├── angular.json                 # Angular CLI config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

## Conclusion

The Expense Tracker PWA architecture prioritizes simplicity, maintainability, and offline-first functionality. The service-oriented design enables clear separation of concerns, while Angular's built-in features (DI, routing, forms) provide a solid foundation. The use of GitHub as a backend eliminates infrastructure complexity while maintaining data ownership and version control.
