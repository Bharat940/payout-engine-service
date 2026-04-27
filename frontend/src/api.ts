import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const MERCHANT_ID = "1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Merchant-ID": MERCHANT_ID,
  },
});

export interface Payout {
  id: string;
  amount_paise: number;
  status: "pending" | "processing" | "completed" | "failed";
  idempotency_key: string;
  bank_account: number;
  bank_account_details: {
    bank_name: string;
    account_number: string;
  };
  created_at: string;
  updated_at: string;
}

export interface BalanceResponse {
  total_balance: number;
  held_balance: number;
  available_balance: number;
}

export interface LedgerEntry {
  id: number;
  entry_type: "credit" | "debit";
  amount_paise: number;
  description: string;
  created_at: string;
}

export const getBalance = () => api.get<BalanceResponse>("/balance/");
export const getPayouts = () => api.get<Payout[]>("/payouts/");
export const getLedger = () => api.get<LedgerEntry[]>("/ledger/");
export const createPayout = (
  amountPaise: number,
  bankAccountId: number,
  idempotencyKey: string,
) =>
  api.post<Payout>(
    "/payouts/",
    { amount_paise: amountPaise, bank_account_id: bankAccountId },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );

export default api;
