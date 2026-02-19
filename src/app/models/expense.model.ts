/**
 * Payment status for an expense
 * - PENDING: Payment is scheduled but not yet made
 * - PAID: Payment has been completed
 * - FAILED: Payment attempt failed
 */
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

/**
 * Periodicity of an expense
 * - MENSUAL: Monthly payment
 * - BIMENSUAL: Bi-monthly payment (every 2 months)
 * - TRIMESTRAL: Quarterly payment (every 3 months)
 * - ANUAL: Annual payment
 */
export type Periodicity = 'MENSUAL' | 'BIMENSUAL' | 'TRIMESTRAL' | 'ANUAL';

/**
 * Fraction of a payment when split into multiple parts
 * - ÚNICA: Single payment (not split)
 * - PRIMERA: First installment
 * - SEGONA: Second installment
 * - TERCERA: Third installment
 * - QUARTA: Fourth installment
 */
export type Fraction = 'ÚNICA' | 'PRIMERA' | 'SEGONA' | 'TERCERA' | 'QUARTA';

/**
 * Expense interface representing a recurring domestic payment obligation
 * 
 * Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7
 */
export interface Expense {
  /** Unique identifier (UUID v4) */
  id: string;
  
  /** Display name of the expense */
  name: string;
  
  /** Detailed description of the expense */
  description: string;
  
  /** Entity that issues the bill */
  issuer: string;
  
  /** Custom tag for grouping expenses */
  tag: string;
  
  /** Category of the expense */
  category: string;
  
  /** Expected payment amount */
  approximateAmount: number;
  
  /** Date when payment is due */
  scheduledPaymentDate: Date;
  
  /** Date when payment was actually made (null if not yet paid) */
  actualPaymentDate: Date | null;
  
  /** Actual amount paid (null if not yet paid) */
  actualAmount: number | null;
  
  /** Current payment status */
  paymentStatus: PaymentStatus;
  
  /** Bank used for payment */
  bank: string;
  
  /** Periodicity of the expense */
  periodicity: Periodicity;
  
  /** Fraction of payment when split into installments */
  fraction: Fraction;
  
  /** Timestamp when expense was created */
  createdAt: Date;
}

/**
 * Authentication credentials for user login
 */
export interface AuthCredentials {
  /** Username for authentication */
  username: string;
  
  /** Password for authentication */
  password: string;
}

/**
 * GitHub repository configuration for data persistence
 */
export interface GitHubConfig {
  /** Personal Access Token for GitHub API authentication */
  token: string;
  
  /** Repository owner (username or organization) */
  owner: string;
  
  /** Repository name */
  repo: string;
  
  /** Branch name (default: main) */
  branch: string;
  
  /** Path to data file within repository (default: data/expenses.json) */
  filePath: string;
  
  /** Path to settings file within repository (default: settings.json) */
  settingsFilePath: string;
}

/**
 * GitHub API response when retrieving file contents
 */
export interface GitHubFileResponse {
  /** Base64 encoded file content */
  content: string;
  
  /** File SHA hash for version tracking and updates */
  sha: string;
  
  /** Content encoding type (typically 'base64') */
  encoding: string;
}
