import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoanSummaryPanel } from "@/components/loans/LoanSummaryPanel";
import { DeleteLoanDialog } from "@/components/loans/DeleteLoanDialog";
import { AmortizationTable } from "@/components/amortization/AmortizationTable";
import { AmortizationSummary } from "@/components/amortization/AmortizationSummary";
import { RepaymentLog } from "@/components/repayments/RepaymentLog";
import { Button } from "@/components/ui/button";
import { Loan, AmortizationSchedule, Repayment } from "@/types";
import { Pencil, Plus } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function fetchWithCookie(path: string, sessionCookie: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Cookie: `lb_session=${sessionCookie}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("lb_session")?.value ?? "";
  const role = cookieStore.get("lb_role")?.value;
  const isAdmin = role === "admin";

  const [loan, schedule, repayments] = await Promise.all([
    fetchWithCookie(`/api/loans/${id}`, sessionCookie) as Promise<Loan | null>,
    fetchWithCookie(`/api/loans/${id}/amortization`, sessionCookie) as Promise<AmortizationSchedule | null>,
    fetchWithCookie(`/api/loans/${id}/repayments`, sessionCookie) as Promise<Repayment[] | null>,
  ]);

  if (!loan) notFound();

  return (
    <AppShell>
      <PageHeader
        title={loan.name}
        backHref="/dashboard"
        backLabel="Dashboard"
        action={
          isAdmin && (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/loans/${id}/edit`}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <DeleteLoanDialog loanId={id} loanName={loan.name} />
            </div>
          )
        }
      />

      <div className="space-y-6">
        <LoanSummaryPanel loan={loan} />

        {schedule && (
          <>
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Summary</h2>
              </div>
              <AmortizationSummary summary={schedule.summary} />
            </section>

            <section>
              <h2 className="font-semibold mb-3">Amortization Schedule</h2>
              <AmortizationTable periods={schedule.periods} />
            </section>
          </>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Repayment History</h2>
            {isAdmin && (
              <Button asChild size="sm">
                <Link href={`/loans/${id}/repayments/new`}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Repayment
                </Link>
              </Button>
            )}
          </div>
          <RepaymentLog
            repayments={repayments ?? []}
            loanId={id}
            isAdmin={isAdmin}
          />
        </section>
      </div>
    </AppShell>
  );
}
