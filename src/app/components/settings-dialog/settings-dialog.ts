import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Data passed to the settings dialog
 */
export interface SettingsDialogData {
  /** Type of setting being edited */
  type: 'category' | 'tag';
  /** Mode of operation */
  mode: 'add' | 'edit';
  /** Current value when editing */
  currentValue?: string;
}

/**
 * Result returned from the settings dialog
 */
export interface SettingsDialogResult {
  /** The entered/edited value */
  value: string;
}

/**
 * Dialog component for adding or editing categories and tags
 * 
 * Requirements: 3.1, 4.1, 6.1, 7.1
 */
@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './settings-dialog.html',
  styleUrls: ['./settings-dialog.scss']
})
export class SettingsDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SettingsDialogComponent>);

  settingsForm: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: SettingsDialogData) {
    this.settingsForm = this.fb.group({
      value: [data.currentValue || '', [Validators.required, Validators.minLength(1)]]
    });
  }

  /**
   * Gets the dialog title based on mode and type
   */
  getTitle(): string {
    const typeLabel = this.data.type === 'category' ? 'Categoria' : 'Etiqueta';
    return this.data.mode === 'add' ? `Afegir ${typeLabel}` : `Editar ${typeLabel}`;
  }

  /**
   * Gets the icon for the dialog based on mode
   */
  getIcon(): string {
    return this.data.mode === 'add' ? 'add_circle' : 'edit';
  }

  /**
   * Gets the placeholder text based on type
   */
  getPlaceholder(): string {
    return this.data.type === 'category' ? 'Nom de la categoria' : 'Nom de l\'etiqueta';
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    const result: SettingsDialogResult = {
      value: this.settingsForm.value.value.trim()
    };

    this.dialogRef.close(result);
  }

  /**
   * Handles cancel button click
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
