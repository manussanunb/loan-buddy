import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAnyRole, requireAdmin, isAuthError } from "@/lib/auth";
import { computeAmortizationSchedule } from "@/lib/amortization";
import { Loan, Repayment } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAnyRole(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const { data, error } = await supabase
    .from("repayments")
    .select("*")
    .eq("loan_id", id)
    .order("paid_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const body = await req.json();
  const { amount, paid_at, note } = body;

  if (!amount || !paid_at) {
    return NextResponse.json({ error: "amount and paid_at are required" }, { status: 400 });
  }

  if (amount <= 0) {
    return NextResponse.json({ error: "amount must be positive" }, { status: 400 });
  }

  const { data: repayment, error } = await supabase
    .from("repayments")
    .insert({ loan_id: id, amount, paid_at, note: note || null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recompute status and update loan if paid off
  await updateLoanStatus(id);

  return NextResponse.json(repayment, { status: 201 });
}

async function updateLoanStatus(loanId: string) {
  const [{ data: loan }, { data: repayments }] = await Promise.all([
    supabase.from("loans").select("*").eq("id", loanId).single(),
    supabase.from("repayments").select("*").eq("loan_id", loanId).order("paid_at"),
  ]);

  if (!loan || !repayments) return;

  const schedule = computeAmortizationSchedule(loan as Loan, repayments as Repayment[]);
  const newStatus = schedule.summary.is_paid_off ? "paid_off" : "active";

  if (loan.status !== newStatus) {
    await supabase
      .from("loans")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", loanId);
  }
}
