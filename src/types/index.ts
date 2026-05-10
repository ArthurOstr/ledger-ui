
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
