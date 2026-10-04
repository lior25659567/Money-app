export type Transaction = {
  unique_id: string;
  company_id: string;
  account: string;
  status: string;
  activity_date: string; // YYYY-MM-DD
  charged_amount: number;
  charged_currency: string | null;
  original_amount: number | null;
  original_currency: string | null;
  description: string | null;
  memo: string | null;
};
