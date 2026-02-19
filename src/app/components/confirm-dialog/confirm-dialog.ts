import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

/**
 * Data interface for ConfirmDialog
 * 
 * Requirements: 5.2, 8.2
 */
export interface ConfirmDialogData {
  /** Dialog title */
  title: string;
  
  /** Confirmation message */
  message: string;
}

/**
 * Reusable confirmation dialog component
 * 
 * Requirements: 5.2, 8.2
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Handle confirm action
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
