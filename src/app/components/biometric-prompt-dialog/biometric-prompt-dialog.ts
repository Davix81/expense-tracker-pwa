import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Biometric authentication enrollment prompt dialog
 * 
 * Displays after successful password login to ask if user wants to enable
 * biometric authentication for future logins.
 * 
 * Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.4, 5.5
 */
@Component({
  selector: 'app-biometric-prompt-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './biometric-prompt-dialog.html',
  styleUrl: './biometric-prompt-dialog.scss',
})
export class BiometricPromptDialogComponent {
  private dialogRef = inject(MatDialogRef<BiometricPromptDialogComponent>);

  /**
   * Handle decline action - user does not want to enable biometric auth
   * Requirements: 1.2, 1.3
   */
  onDecline(): void {
    this.dialogRef.close(false);
  }

  /**
   * Handle accept action - user wants to enable biometric auth
   * Requirements: 1.2
   */
  onAccept(): void {
    this.dialogRef.close(true);
  }
}
