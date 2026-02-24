import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RepaymentForm } from "@/components/repayments/RepaymentForm";
import { Loan, AmortizationSchedule } from "@/types";
import { computeMonthlyPayment } from "@/lib/amortization";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function fetchWithCookie(path: string, sessionCookie: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Cookie: `lb_session=${sessionCookie}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function NewRepaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("lb_session")?.value ?? "";

  const [loan, schedule] = await Promise.all([
    fetchWithCookie(`/api/loans/${id}`, sessionCookie) as Promise<Loan | null>,
    fetchWithCookie(`/api/loans/${id}/amortization`, sessionCookie) as Promise<AmortizationSchedule | null>,
  ]);

  // Find the first unpaid/overdue/partial period
  const currentPeriod = schedule?.periods.find((p) => p.status !== "paid") ?? null;
  const monthlyPayment = loan
    ? computeMonthlyPayment(loan.principal, loan.annual_rate, loan.term_months)
    : null;

  return (
    <AppShell>
      <PageHeader
        title="Add Repayment"
        backHref={`/loans/${id}`}
        backLabel="Loan Detail"
      />
      <RepaymentForm
        loanId={id}
        currentPeriodDueDate={currentPeriod?.due_date ?? null}
        monthlyPayment={monthlyPayment}
      />
    </AppShell>
  );
}
