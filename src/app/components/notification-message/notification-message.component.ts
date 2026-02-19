import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Reusable notification message component
 * Displays success, error, warning, or info messages with consistent styling
 */
@Component({
  selector: 'app-notification-message',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './notification-message.component.html',
  styleUrl: './notification-message.component.scss'
})
export class NotificationMessageComponent {
  @Input() message: string = '';
  @Input() type: NotificationType = 'info';
  @Input() show: boolean = false;

  /**
   * Get the appropriate icon for the notification type
   */
  getIcon(): string {
    const icons: Record<NotificationType, string> = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return icons[this.type];
  }
}
