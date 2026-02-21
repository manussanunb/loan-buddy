import { addMonths } from "date-fns";
import {
  AmortizationPeriod,
  AmortizationSchedule,
  Loan,
  Repayment,
} from "@/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Compute the standard monthly payment using the reducing balance (PMT) formula.
 * monthly_rate = annual_rate / 100 / 12
 * pmt = P * [r(1+r)^n] / [(1+r)^n - 1]
 * If rate is 0, pmt = P / n
 */
export function computeMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return round2(principal / termMonths);
  const factor = Math.pow(1 + r, termMonths);
  return round2((principal * (r * factor)) / (factor - 1));
}

/**
 * Compute how many months until the loan is paid off at a given monthly payment.
 * n = -log(1 - P*r/pmt) / log(1+r)
 * Returns ceiling of months.
 */
export function computeTermFromPayment(
  principal: number,
  annualRate: number,
  monthlyPayment: number
): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil(principal / monthlyPayment);
  const ratio = (principal * r) / monthlyPayment;
  if (ratio >= 1) return Infinity; // payment doesn't cover interest
  return Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r));
}

/**
 * Build the array of due dates for all periods.
 * Period 1 due date = first_payment_date
 * Period k due date = addMonths(first_payment_date, k - 1)
 * Uses date-fns addMonths which handles month-end overflow correctly.
 */
function buildDueDates(firstPaymentDate: string, termMonths: number): Date[] {
  const base = new Date(firstPaymentDate + "T00:00:00");
  return Array.from({ length: termMonths }, (_, i) => addMonths(base, i));
}

/**
 * Core computation: given a loan and its actual repayments, produce the full
 * amortization schedule showing how each period was (or will be) settled.
 *
 * Repayment-to-period matching:
 *   Period 1 owns repayments where paid_at <= period[1].due_date
 *   Period k owns repayments where period[k-1].due_date < paid_at <= period[k].due_date
 */
export function computeAmortizationSchedule(
  loan: Loan,
  repayments: Repayment[]
): AmortizationSchedule {
  const {
    principal,
    annual_rate,
    term_months,
    first_payment_date,
    start_date,
  } = loan;

  const r = annual_rate / 100 / 12;
  const pmt = computeMonthlyPayment(principal, annual_rate, term_months);
  const dueDates = buildDueDates(first_payment_date, term_months);
  const todayMs = Date.now();

  // Sort repayments chronologically
  const sortedRepayments = [...repayments].sort(
    (a, b) => new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime()
  );

  // Track which repayments have been consumed
  const remaining = sortedRepayments.map((r) => ({ ...r, leftover: r.amount }));

  const periods: AmortizationPeriod[] = [];
  let runningBalance = principal;

  // Lower bound date for period 1 is the start_date (or beginning of time)
  const loanStartDate = new Date(start_date + "T00:00:00");

  let totalPaid = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  for (let i = 0; i < term_months; i++) {
    if (round2(runningBalance) <= 0) break;

    const dueDate = dueDates[i];
    const prevDueDate = i === 0 ? loanStartDate : dueDates[i - 1];

    // Collect repayments belonging to this period
    const periodRepayments: typeof remaining = [];
    for (const rep of remaining) {
      if (rep.leftover <= 0) continue;
      const paidDate = new Date(rep.paid_at + "T00:00:00");
      if (paidDate > prevDueDate && paidDate <= dueDate) {
        periodRepayments.push(rep);
      }
    }

    const openingBalance = round2(runningBalance);

    // Interest for this period
    const interest = round2(openingBalance * r);

    // Standard scheduled payment (capped at remaining balance + interest for last period)
    const scheduledPayment = round2(Math.min(pmt, openingBalance + interest));

    // Sum actual payments for this period
    const actualPayment = round2(
      periodRepayments.reduce((sum, rep) => sum + rep.leftover, 0)
    );

    let interestPaid = 0;
    let principalPaid = 0;
    let extraPrincipal = 0;
    let closingBalance = openingBalance;
    let status: AmortizationPeriod["status"];

    if (actualPayment >= scheduledPayment) {
      // Fully paid (or overpaid)
      interestPaid = interest;
      principalPaid = round2(scheduledPayment - interest);
      extraPrincipal = round2(actualPayment - scheduledPayment);
      closingBalance = round2(openingBalance - principalPaid - extraPrincipal);
      status = "paid";
    } else if (actualPayment > 0) {
      // Partial payment — interest first
      interestPaid = round2(Math.min(actualPayment, interest));
      principalPaid = round2(Math.max(0, actualPayment - interest));
      extraPrincipal = 0;
      closingBalance = round2(openingBalance - principalPaid);
      status = "partial";
    } else {
      // No payment
      interestPaid = 0;
      principalPaid = 0;
      extraPrincipal = 0;
      closingBalance = openingBalance;
      status = dueDate.getTime() < todayMs ? "overdue" : "upcoming";
    }

    closingBalance = Math.max(0, round2(closingBalance));

    totalPaid += actualPayment;
    totalInterestPaid += interestPaid;
    totalPrincipalPaid += principalPaid + extraPrincipal;

    periods.push({
      period: i + 1,
      due_date: dueDate.toISOString().split("T")[0],
      opening_balance: openingBalance,
      scheduled_payment: scheduledPayment,
      actual_payment: actualPayment,
      interest_paid: interestPaid,
      principal_paid: principalPaid + extraPrincipal,
      extra_principal: extraPrincipal,
      closing_balance: closingBalance,
      status,
      repayment_ids: periodRepayments.map((rep) => rep.id),
    });

    runningBalance = closingBalance;
  }

  const remainingBalance = round2(Math.max(0, runningBalance));

  return {
    periods,
    summary: {
      total_scheduled: round2(pmt * term_months),
      total_paid: round2(totalPaid),
      total_interest_paid: round2(totalInterestPaid),
      total_principal_paid: round2(totalPrincipalPaid),
      remaining_balance: remainingBalance,
      is_paid_off: remainingBalance <= 0.01,
    },
  };
}

/**
 * Ephemeral schedule for the calculator (no real repayments).
 */
export function computeScheduleFromInputs(params: {
  principal: number;
  annual_rate: number;
  term_months: number;
  first_payment_date: string;
}): AmortizationSchedule {
  const fakeLoan: Loan = {
    id: "calc",
    name: "Calculator",
    principal: params.principal,
    annual_rate: params.annual_rate,
    term_value: params.term_months,
    term_unit: "months",
    term_months: params.term_months,
    start_date: params.first_payment_date,
    first_payment_date: params.first_payment_date,
    status: "active",
    created_at: "",
    updated_at: "",
  };
  return computeAmortizationSchedule(fakeLoan, []);
}
