import { NextRequest, NextResponse } from "next/server";
import {
  computeScheduleFromInputs,
  computeMonthlyPayment,
  computeTermFromPayment,
} from "@/lib/amortization";
import { CalculatorInput } from "@/types";
import { today } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body: CalculatorInput = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { mode, principal, annual_rate } = body;

  if (!principal || !annual_rate || principal <= 0 || annual_rate <= 0) {
    return NextResponse.json({ error: "Invalid principal or rate" }, { status: 400 });
  }

  let termMonths: number;
  let monthlyPayment: number;

  if (mode === "fixed_term") {
    if (!body.term_months || body.term_months <= 0) {
      return NextResponse.json({ error: "term_months required for fixed_term mode" }, { status: 400 });
    }
    termMonths = body.term_months;
    monthlyPayment = computeMonthlyPayment(principal, annual_rate, termMonths);
  } else if (mode === "fixed_payment") {
    if (!body.monthly_payment || body.monthly_payment <= 0) {
      return NextResponse.json({ error: "monthly_payment required for fixed_payment mode" }, { status: 400 });
    }
    monthlyPayment = body.monthly_payment;
    termMonths = computeTermFromPayment(principal, annual_rate, monthlyPayment);

    if (!isFinite(termMonths)) {
      return NextResponse.json(
        { error: "Monthly payment is too low to cover interest" },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const firstPaymentDate = body.first_payment_date ?? today();
  const schedule = computeScheduleFromInputs({
    principal,
    annual_rate,
    term_months: termMonths,
    first_payment_date: firstPaymentDate,
  });

  return NextResponse.json({ ...schedule, monthly_payment: monthlyPayment, term_months: termMonths });
}
