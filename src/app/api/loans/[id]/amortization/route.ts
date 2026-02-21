import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAnyRole, isAuthError } from "@/lib/auth";
import { computeAmortizationSchedule } from "@/lib/amortization";
import { Loan, Repayment } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAnyRole(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;

  const [loanRes, repaymentsRes] = await Promise.all([
    supabase.from("loans").select("*").eq("id", id).single(),
    supabase
      .from("repayments")
      .select("*")
      .eq("loan_id", id)
      .order("paid_at", { ascending: true }),
  ]);

  if (loanRes.error) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  const schedule = computeAmortizationSchedule(
    loanRes.data as Loan,
    (repaymentsRes.data ?? []) as Repayment[]
  );

  return NextResponse.json(schedule);
}
