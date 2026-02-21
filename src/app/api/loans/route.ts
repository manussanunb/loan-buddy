import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAnyRole, requireAdmin, isAuthError } from "@/lib/auth";
import { LoanFormValues } from "@/types";

export async function GET(req: NextRequest) {
  const auth = await requireAnyRole(req);
  if (isAuthError(auth)) return auth;

  const { data, error } = await supabase
    .from("loans")
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

  if (!name || !principal || !annual_rate || !term_value || !term_unit || !start_date || !first_payment_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const term_months = term_unit === "years" ? term_value * 12 : term_value;

  const { data, error } = await supabase
    .from("loans")
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
