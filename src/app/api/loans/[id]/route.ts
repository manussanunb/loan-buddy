import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAnyRole, requireAdmin, isAuthError } from "@/lib/auth";
import { LoanFormValues } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAnyRole(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const { data, error } = await supabase
    .from("lb_loans")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const body: LoanFormValues = await req.json();
  const { name, principal, annual_rate, term_value, term_unit, start_date, first_payment_date, note } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (typeof principal !== "number" || principal <= 0) {
    return NextResponse.json({ error: "principal must be a positive number" }, { status: 400 });
  }
  if (typeof annual_rate !== "number" || annual_rate <= 0 || annual_rate > 100) {
    return NextResponse.json({ error: "annual_rate must be between 0 and 100" }, { status: 400 });
  }
  if (typeof term_value !== "number" || term_value <= 0 || !Number.isInteger(term_value)) {
    return NextResponse.json({ error: "term_value must be a positive integer" }, { status: 400 });
  }
  if (!term_unit || (term_unit !== "months" && term_unit !== "years")) {
    return NextResponse.json({ error: "term_unit must be 'months' or 'years'" }, { status: 400 });
  }
  if (!start_date || !first_payment_date) {
    return NextResponse.json({ error: "start_date and first_payment_date are required" }, { status: 400 });
  }

  const term_months = term_unit === "years" ? term_value * 12 : term_value;

  const { data, error } = await supabase
    .from("lb_loans")
    .update({
      name,
      principal,
      annual_rate,
      term_value,
      term_unit,
      term_months,
      start_date,
      first_payment_date,
      note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const { error } = await supabase.from("lb_loans").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
