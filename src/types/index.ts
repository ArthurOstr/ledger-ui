// COMMON LITERALS
export type CurrencyCode = 'USD' | 'EUR' | 'UAH' | 'PLN' | (string & {});

// Bank and Scope types
export type BankSource = 'monobank' | 'privatbank' | (string & {});
export type BankScope = 'ALL' | 'monobank' | 'privatbank';

// Ingestion and Pipeline Status
export type IngestionStatus = 'queued';

export interface UploadResponse {
  filename?: string;
  user_email?: string;
  message: string;
  job_id: string;
  status: IngestionStatus;
}

// ARQ WORKER JOB STATUS
export type WorkerJobState = 'queued' | 'in_progress' | 'completed' | 'failed';

export interface BaseJobStatusResponse {
  job_id: string; 
}

export interface QueuedJobStatusResponse extends BaseJobStatusResponse {
  status: 'queued';
  inserted_count?: never;
  error?: never;
}

export interface InProgressJobStatusResponse extends BaseJobStatusResponse {
  status: 'in_progress';
  inserted_count?: never;
  error?: never;
}

export interface CompletedJobStatusResponse extends BaseJobStatusResponse {
  status: 'completed';
  inserted_count: number;
  error?: null;
}

export interface FailedJobStatusResponse extends BaseJobStatusResponse {
  status: 'failed';
  inserted_count?: 0;
  error: string;
}

export type StatusResponse = QueuedJobStatusResponse | InProgressJobStatusResponse | CompletedJobStatusResponse | FailedJobStatusResponse;

// TRANSACTIONS

export interface Transaction {
  id: number;
  date: string;
  bank: 'monobank' | 'privatbank' | (string & {});
  category: string | null;
  card: string | null;
  description: string | null;
  amount: number;
  currency: CurrencyCode;
  balance_after: number | null;
  balance_currency: CurrencyCode;
  transaction_currency: CurrencyCode;
  transaction_amount: number | null;
  hash_id: string;
  created_at: string;
}

// CATEGORIZATION RULES

export interface CategoryRuleCreate {
  keyword: string;
  assigned_category: string;
  is_active: boolean;
}

export interface CategoryRuleResponse {
  id: number;
  owner_id: number;
  keyword: string;
  assigned_category: string;
  is_active: boolean;
}

// DASHBOARD AND VAULT ANALYTICS

export interface CardVault {
  bank: BankSource;
  card: string;
  currency: CurrencyCode;
  latestBalance: number | null;
  lastActiveDate: string;
}

export interface FinancialSummary {
  netWorthUAH: number;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  vaults: CardVault[];
  foreignVaults: Record<string, number>;
}

// Recharts visual analytics

export interface BalancePoint {
  date: string;
  timestamp: number;
  balance: number;
  card?: string;
  bank?: string;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
}