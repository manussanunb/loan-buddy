-- LoanBuddy — Supabase Schema
-- Run this in the Supabase SQL Editor after creating your project

CREATE TABLE loans (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  principal          NUMERIC(15,2) NOT NULL,
  annual_rate        NUMERIC(6,4) NOT NULL,       -- e.g. 7.5 means 7.5% p.a.
  term_value         INTEGER NOT NULL,
  term_unit          TEXT NOT NULL CHECK (term_unit IN ('months','years')),
  term_months        INTEGER NOT NULL,             -- derived: term_value*12 if years, else term_value
  start_date         DATE NOT NULL,
  first_payment_date DATE NOT NULL,
  note               TEXT,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paid_off')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE repayments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id    UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount     NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  paid_at    DATE NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_repayments_loan ON repayments(loan_id, paid_at);

-- RLS is disabled — access is enforced at the Next.js API layer using the service role key
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE repayments DISABLE ROW LEVEL SECURITY;
