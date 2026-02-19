import { Routes } from '@angular/router';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { ExpenseListPageComponent } from './components/expense-list-page/expense-list-page.component';
import { DashboardPageComponent } from './components/dashboard-page/dashboard-page';
import { SettingsPage } from './components/settings-page/settings-page';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { 
    path: 'dashboard', 
    component: DashboardPageComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'expenses', 
    component: ExpenseListPageComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'settings', 
    component: SettingsPage,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' }
];
