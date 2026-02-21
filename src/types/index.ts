export type Role = "admin" | "friend";
export type LoanStatus = "active" | "paid_off";
export type PeriodStatus = "paid" | "partial" | "overdue" | "upcoming";
export type TermUnit = "months" | "years";
export type CalculatorMode = "fixed_term" | "fixed_payment";

export interface Loan {
  id: string;
  name: string;
  principal: number;
  annual_rate: number; // e.g. 7.5 means 7.5% per year
  term_value: number;
  term_unit: TermUnit;
  term_months: number; // derived: term_value * 12 if years, else term_value
  start_date: string; // ISO date
  first_payment_date: string; // ISO date
  note?: string;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
}

export interface Repayment {
  id: string;
  loan_id: string;
  amount: number;
  paid_at: string; // ISO date
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface AmortizationPeriod {
  period: number; // 1-based
  due_date: string; // ISO date
  opening_balance: number;
  scheduled_payment: number;
  actual_payment: number;
  interest_paid: number;
  principal_paid: number;
  extra_principal: number;
  closing_balance: number;
  status: PeriodStatus;
  repayment_ids: string[];
}

export interface AmortizationSummaryData {
  total_scheduled: number;
  total_paid: number;
  total_interest_paid: number;
  total_principal_paid: number;
  remaining_balance: number;
  is_paid_off: boolean;
}

export interface AmortizationSchedule {
  periods: AmortizationPeriod[];
  summary: AmortizationSummaryData;
}

export interface CalculatorInput {
  mode: CalculatorMode;
  principal: number;
  annual_rate: number;
  term_months?: number;
  monthly_payment?: number;
  first_payment_date?: string; // for generating period dates
}

export interface Session {
  role: Role;
  iat: number;
  exp: number;
}

// Form types
export interface LoanFormValues {
  name: string;
  principal: number;
  annual_rate: number;
  term_value: number;
  term_unit: TermUnit;
  start_date: string;
  first_payment_date: string;
  note?: string;
}

export interface RepaymentFormValues {
  amount: number;
  paid_at: string;
  note?: string;
}
