import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { SettingsService } from '../../services/settings.service';
import { ExpenseService } from '../../services/expense.service';
import { GitHubStorageService } from '../../services/github-storage.service';
import { AuthService } from '../../services/auth.service';
import { NotificationMessageComponent, NotificationType } from '../notification-message/notification-message.component';

/**
 * Settings page component for managing categories and tags
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */
@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    NotificationMessageComponent
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage implements OnInit {
  private settingsService = inject(SettingsService);
  private expenseService = inject(ExpenseService);
  private githubStorage = inject(GitHubStorageService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Observables for template
  categories$: Observable<string[]> = this.settingsService.categories$;
  tags$: Observable<string[]> = this.settingsService.tags$;

  // Table columns
  displayedColumns: string[] = ['name', 'actions'];

  // Error message for display
  errorMessage: string | null = null;

  // Download state
  downloadMessage: string = '';
  downloadType: NotificationType = 'success';
  showDownloadMessage: boolean = false;

  // Upload state
  uploadMessage: string = '';
  uploadType: NotificationType = 'success';
  showUploadMessage: boolean = false;
  selectedExpensesFile: File | null = null;
  selectedSettingsFile: File | null = null;

  /**
   * Initialize component and load settings
   * 
   * Requirements: 2.1, 2.2, 2.3, 9.5, 11.1
   */
  ngOnInit(): void {
    this.loadSettings();
  }

  /**
   * Load settings from storage
   * 
   * Requirements: 2.3, 11.1
   */
  private loadSettings(): void {
    this.errorMessage = null;
    this.settingsService.loadSettings().subscribe({
      error: (error) => {
        this.handleLoadError(error);
      }
    });
  }

  /**
   * Handle errors when loading settings
   * 
   * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
   */
  private handleLoadError(error: any): void {
    console.error('Error loading settings:', error);
    
    // Determine error type and show appropriate message
    if (error.status === 401 || error.status === 403) {
      this.errorMessage = 'Error d\'autenticació amb GitHub. Comprova les teves credencials.';
    } else if (error.status === 404) {
      this.errorMessage = 'Arxiu de configuració no trobat. Es crearà un de nou quan afegeixis categories o etiquetes.';
    } else if (!navigator.onLine) {
      this.errorMessage = 'No hi ha connexió a internet. Comprova la teva connexió.';
    } else if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      this.errorMessage = 'L\'arxiu de configuració està corrupte. Es crearà un de nou.';
    } else {
      this.errorMessage = 'Error carregant la configuració. Torna-ho a provar més tard.';
    }
  }

  // Placeholder methods for CRUD operations (to be implemented in next tasks)
  onAddCategory(): void {
    this.openSettingsDialog('category', 'add').subscribe(result => {
      if (result) {
        this.settingsService.addCategory(result.value).subscribe({
          next: () => {
            this.snackBar.open('Categoria afegida correctament', 'Tancar', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open(error.message || 'Error afegint la categoria', 'Tancar', { duration: 5000 });
          }
        });
      }
    });
  }
  
  onEditCategory(category: string): void {
    this.openSettingsDialog('category', 'edit', category).subscribe(result => {
      if (result) {
        this.settingsService.updateCategory(category, result.value).subscribe({
          next: () => {
            this.snackBar.open('Categoria actualitzada correctament', 'Tancar', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open(error.message || 'Error actualitzant la categoria', 'Tancar', { duration: 5000 });
          }
        });
      }
    });
  }
  onDeleteCategory(category: string): void {
    this.openConfirmDialog(
      'Eliminar Categoria',
      `Estàs segur que vols eliminar la categoria "${category}"?`
    ).subscribe(confirmed => {
      if (confirmed) {
        this.settingsService.deleteCategory(category).subscribe({
          next: () => {
            this.snackBar.open('Categoria eliminada correctament', 'Tancar', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open(error.message || 'Error eliminant la categoria', 'Tancar', { duration: 5000 });
          }
        });
      }
    });
  }
  onAddTag(): void {
    this.openSettingsDialog('tag', 'add').subscribe(result => {
      if (result) {
        this.settingsService.addTag(result.value).subscribe({
          next: () => {
            this.snackBar.open('Etiqueta afegida correctament', 'Tancar', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open(error.message || 'Error afegint l\'etiqueta', 'Tancar', { duration: 5000 });
          }
        });
      }
    });
  }
  onEditTag(tag: string): void {
    this.openSettingsDialog('tag', 'edit', tag).subscribe(result => {
      if (result) {
        this.settingsService.updateTag(tag, result.value).subscribe({
          next: () => {
            this.snackBar.open('Etiqueta actualitzada correctament', 'Tancar', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open(error.message || 'Error actualitzant l\'etiqueta', 'Tancar', { duration: 5000 });
          }
        });
      }
    });
  }
  onDeleteTag(tag: string): void {
    this.openConfirmDialog(
      'Eliminar Etiqueta',
      `Estàs segur que vols eliminar l'etiqueta "${tag}"?`
    ).subscribe(confirmed => {
      if (confirmed) {
        this.settingsService.deleteTag(tag).subscribe({
          next: () => {
            this.snackBar.open('Etiqueta eliminada correctament', 'Tancar', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open(error.message || 'Error eliminant l\'etiqueta', 'Tancar', { duration: 5000 });
          }
        });
      }
    });
  }

  /**
   * Handle logout button click
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Download expenses JSON file
   */
  downloadExpensesJson(): void {
    this.showDownloadMessage = false;

    this.githubStorage.readExpenses().subscribe({
      next: (expenses) => {
        this.downloadJsonFile(expenses, 'expenses.json');
        this.downloadMessage = 'Arxiu expenses.json descarregat correctament';
        this.downloadType = 'success';
        this.showDownloadMessage = true;
        
        setTimeout(() => {
          this.showDownloadMessage = false;
        }, 5000);
      },
      error: (error) => {
        console.error('Error downloading expenses:', error);
        this.downloadMessage = 'Error en descarregar expenses.json: ' + error.message;
        this.downloadType = 'error';
        this.showDownloadMessage = true;
        
        setTimeout(() => {
          this.showDownloadMessage = false;
        }, 5000);
      }
    });
  }

  /**
   * Download settings JSON file
   */
  downloadSettingsJson(): void {
    this.showDownloadMessage = false;

    this.githubStorage.readSettings().subscribe({
      next: (settings) => {
        this.downloadJsonFile(settings, 'settings.json');
        this.downloadMessage = 'Arxiu settings.json descarregat correctament';
        this.downloadType = 'success';
        this.showDownloadMessage = true;
        
        setTimeout(() => {
          this.showDownloadMessage = false;
        }, 5000);
      },
      error: (error) => {
        console.error('Error downloading settings:', error);
        this.downloadMessage = 'Error en descarregar settings.json: ' + error.message;
        this.downloadType = 'error';
        this.showDownloadMessage = true;
        
        setTimeout(() => {
          this.showDownloadMessage = false;
        }, 5000);
      }
    });
  }

  /**
   * Helper method to download JSON data as a file
   */
  private downloadJsonFile(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Handle expenses file selection
   */
  onExpensesFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedExpensesFile = input.files[0];
      this.showUploadMessage = false;
    }
  }

  /**
   * Handle settings file selection
   */
  onSettingsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedSettingsFile = input.files[0];
      this.showUploadMessage = false;
    }
  }

  /**
   * Upload selected files to GitHub
   */
  uploadFiles(): void {
    this.showUploadMessage = false;
    let uploadCount = 0;
    let errorCount = 0;
    let errorMessages: string[] = [];
    const totalFiles = (this.selectedExpensesFile ? 1 : 0) + (this.selectedSettingsFile ? 1 : 0);

    if (totalFiles === 0) {
      return;
    }

    const uploadPromises: Promise<void>[] = [];

    // Upload expenses file
    if (this.selectedExpensesFile) {
      uploadPromises.push(
        this.readAndUploadExpenses(this.selectedExpensesFile)
          .then(() => {
            uploadCount++;
          })
          .catch((error) => {
            errorCount++;
            errorMessages.push(`Expenses: ${error.message}`);
            console.error('Error uploading expenses:', error);
          })
      );
    }

    // Upload settings file
    if (this.selectedSettingsFile) {
      uploadPromises.push(
        this.readAndUploadSettings(this.selectedSettingsFile)
          .then(() => {
            uploadCount++;
          })
          .catch((error) => {
            errorCount++;
            errorMessages.push(`Settings: ${error.message}`);
            console.error('Error uploading settings:', error);
          })
      );
    }

    // Wait for all uploads to complete
    Promise.all(uploadPromises).finally(() => {
      if (errorCount === 0) {
        this.uploadMessage = `${uploadCount} arxiu(s) pujat(s) correctament a GitHub`;
        this.uploadType = 'success';
      } else if (uploadCount === 0) {
        this.uploadMessage = errorMessages.join('. ');
        this.uploadType = 'error';
      } else {
        this.uploadMessage = `${uploadCount} arxiu(s) pujat(s), ${errorCount} amb errors: ${errorMessages.join('. ')}`;
        this.uploadType = 'warning';
      }
      
      this.showUploadMessage = true;

      setTimeout(() => {
        this.showUploadMessage = false;
      }, 8000);
    });
  }

  /**
   * Read and upload expenses file
   */
  private readAndUploadExpenses(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const expenses = JSON.parse(content);
          
          // Validate that it's an array
          if (!Array.isArray(expenses)) {
            reject(new Error('L\'arxiu expenses.json ha de contenir un array'));
            return;
          }
          
          this.githubStorage.writeExpenses(expenses).subscribe({
            next: () => {
              this.selectedExpensesFile = null;
              resolve();
            },
            error: (error) => {
              const errorMsg = error.message || 'Error al subir expenses.json';
              reject(new Error(errorMsg));
            }
          });
        } catch (error) {
          reject(new Error('Error en parsejar expenses.json: format JSON invàlid'));
        }
      };
      reader.onerror = () => reject(new Error('Error en llegir l\'arxiu'));
      reader.readAsText(file);
    });
  }

  /**
   * Read and upload settings file
   */
  private readAndUploadSettings(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const settings = JSON.parse(content);
          
          // Validate that it has required properties
          if (!settings.categories || !settings.tags) {
            reject(new Error('L\'arxiu settings.json ha de contenir categories i tags'));
            return;
          }
          
          this.githubStorage.writeSettings(settings).subscribe({
            next: () => {
              this.selectedSettingsFile = null;
              // Reload settings to update UI
              this.loadSettings();
              resolve();
            },
            error: (error) => {
              const errorMsg = error.message || 'Error al subir settings.json';
              reject(new Error(errorMsg));
            }
          });
        } catch (error) {
          reject(new Error('Error en parsejar settings.json: format JSON invàlid'));
        }
      };
      reader.onerror = () => reject(new Error('Error en llegir l\'arxiu'));
      reader.readAsText(file);
    });
  }

  /**
   * Open settings dialog for add/edit operations
   * 
   * @param type - Type of setting (category or tag)
   * @param mode - Mode of operation (add or edit)
   * @param currentValue - Current value when editing
   * @returns Observable of dialog result
   */
  private openSettingsDialog(
    type: 'category' | 'tag',
    mode: 'add' | 'edit',
    currentValue?: string
  ): Observable<any> {
    // Import dialog component dynamically
    return new Observable(observer => {
      import('../settings-dialog/settings-dialog').then(m => {
        const dialogRef = this.dialog.open(m.SettingsDialogComponent, {
          width: '400px',
          data: { type, mode, currentValue }
        });

        dialogRef.afterClosed().subscribe(result => {
          observer.next(result);
          observer.complete();
        });
      });
    });
  }

  /**
   * Open confirmation dialog
   * 
   * @param title - Dialog title
   * @param message - Confirmation message
   * @returns Observable of boolean (true if confirmed)
   * 
   * Requirements: 5.2, 5.5, 8.2, 8.5
   */
  private openConfirmDialog(title: string, message: string): Observable<boolean> {
    return new Observable(observer => {
      // Import dialog component dynamically
      import('../confirm-dialog/confirm-dialog').then(m => {
        const dialogRef = this.dialog.open(m.ConfirmDialogComponent, {
          width: '400px',
          data: { title, message }
        });

        dialogRef.afterClosed().subscribe(result => {
          observer.next(result === true);
          observer.complete();
        });
      });
    });
  }
}
