
export interface Transaction {
  id: number;
  date: string;
  category: string | null;
  card: string | null;
  description: string | null;
  amount: number;
  currency: string;
  balance_after: number;
  balance_currency: string;
  transaction_currency: string;
  transaction_amount: number;
  created_at: string;
}

export interface UploadResponse {
  filename?: string;
  message: string;
  job_id: string;
  status: string;
}

export interface StatusResponse {
  job_id: string;
  status: string;
  inserted_count?: number;
  error?: string;
}

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