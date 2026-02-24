import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAnyRole, requireAdmin, isAuthError } from "@/lib/auth";
import { LoanFormValues } from "@/types";

export async function GET(req: NextRequest) {
  const auth = await requireAnyRole(req);
  if (isAuthError(auth)) return auth;

  const { data, error } = await supabase
    .from("lb_loans")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body: LoanFormValues = await req.json();
  const {
    name,
    principal,
    annual_rate,
    term_value,
    term_unit,
    start_date,
    first_payment_date,
    note,
  } = body;

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
    .insert({
      name,
      principal,
      annual_rate,
      term_value,
      term_unit,
      term_months,
      start_date,
      first_payment_date,
      note: note || null,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
