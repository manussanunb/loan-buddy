import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin, isAuthError } from "@/lib/auth";
import { computeAmortizationSchedule } from "@/lib/amortization";
import { Loan, Repayment } from "@/types";

async function updateLoanStatus(loanId: string) {
  const [{ data: loan }, { data: repayments }] = await Promise.all([
    supabase.from("lb_loans").select("*").eq("id", loanId).single(),
    supabase.from("lb_repayments").select("*").eq("loan_id", loanId).order("paid_at"),
  ]);
  if (!loan || !repayments) return;
  const schedule = computeAmortizationSchedule(loan as Loan, repayments as Repayment[]);
  const newStatus = schedule.summary.is_paid_off ? "paid_off" : "active";
  if (loan.status !== newStatus) {
    await supabase
      .from("lb_loans")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", loanId);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; repaymentId: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { id, repaymentId } = await params;
  const body = await req.json();
  const { amount, paid_at, note } = body;

  if (!amount || !paid_at || amount <= 0) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lb_repayments")
    .update({ amount, paid_at, note: note || null, updated_at: new Date().toISOString() })
    .eq("id", repaymentId)
    .eq("loan_id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await updateLoanStatus(id);
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; repaymentId: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { id, repaymentId } = await params;

  const { error } = await supabase
    .from("lb_repayments")
    .delete()
    .eq("id", repaymentId)
    .eq("loan_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await updateLoanStatus(id);
  return NextResponse.json({ ok: true });
}
