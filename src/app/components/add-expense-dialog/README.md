# AddExpenseDialog Component

## Overview

The AddExpenseDialog component is a Material Dialog that provides a reactive form for creating new expenses. It validates all input fields, calls the ExpenseService to persist data, and returns the created expense on success.

## Usage

To open the dialog from a component:

```typescript
import { MatDialog } from '@angular/material/dialog';
import { AddExpenseDialogComponent } from './components/add-expense-dialog/add-expense-dialog.component';

export class YourComponent {
  private dialog = inject(MatDialog);

  openAddExpenseDialog(): void {
    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '600px',
      disableClose: true, // Prevent closing by clicking backdrop
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // result is the created Expense object
        console.log('Expense added:', result);
        // Refresh your expense list here
      }
    });
  }
}
```

## Features

- ✅ Reactive form with all expense fields
- ✅ Validators (required, min, date format)
- ✅ Category dropdown with common categories
- ✅ Payment status dropdown (PENDING/PAID/FAILED)
- ✅ Date pickers for scheduled and actual payment dates
- ✅ Submit handler calling ExpenseService.addExpense()
- ✅ Closes dialog on success with result
- ✅ Displays validation errors inline
- ✅ Cancel button to close without saving
- ✅ Responsive (full screen on mobile)

## Requirements Validated

- **4.1**: Dialog displays reactive form with all expense attributes
- **4.2**: Form submission calls ExpenseService to persist expense
- **4.3**: Form displays validation errors and prevents invalid submission
- **4.6**: All required fields, data types, and date formats are validated

## Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | Text | Yes | Required |
| Description | Textarea | Yes | Required |
| Issuer | Text | Yes | Required |
| Tag | Text | No | - |
| Category | Select | Yes | Required |
| Approximate Amount | Number | Yes | Required, Min: 0 |
| Scheduled Payment Date | Date | Yes | Required |
| Actual Payment Date | Date | No | - |
| Actual Amount | Number | No | Min: 0 |
| Payment Status | Select | Yes | Required (PENDING/PAID/FAILED) |
| Bank | Text | Yes | Required |

## Categories

The component includes these predefined categories:
- Utilities
- Rent/Mortgage
- Insurance
- Subscriptions
- Telecommunications
- Transportation
- Healthcare
- Education
- Entertainment
- Other

## Responsive Behavior

On mobile devices (< 768px), the dialog automatically becomes full-screen for better usability.
