"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AmortizationSummary } from "@/components/amortization/AmortizationSummary";
import { AmortizationTable } from "@/components/amortization/AmortizationTable";
import { AmortizationPlanningTab } from "@/components/amortization/AmortizationPlanningTab";
import { RepaymentLog } from "@/components/repayments/RepaymentLog";
import { Loan, AmortizationSchedule, Repayment } from "@/types";
import { computeMonthlyPayment } from "@/lib/amortization";
import { Plus } from "lucide-react";

interface LoanDetailTabsProps {
  loan: Loan;
  schedule: AmortizationSchedule | null;
  repayments: Repayment[];
  isAdmin: boolean;
}

export function LoanDetailTabs({ loan, schedule, repayments, isAdmin }: LoanDetailTabsProps) {
  let remainingPeriods = 0;
  let totalPayable = 0;

  if (schedule && schedule.summary.remaining_balance > 0) {
    const currentPeriodIndex = schedule.periods.findIndex((p) => p.status !== "paid");
    remainingPeriods = currentPeriodIndex === -1 ? 0 : schedule.periods.length - currentPeriodIndex;

    if (remainingPeriods > 0) {
      const monthlyRate = loan.annual_rate / 100 / 12;
      const monthlyPayment = computeMonthlyPayment(loan.principal, loan.annual_rate, loan.term_months);
      let balance = schedule.summary.remaining_balance;
      for (let i = 0; i < remainingPeriods; i++) {
        const interest = Math.round(balance * monthlyRate * 100) / 100;
        const principal = Math.round(Math.min(monthlyPayment - interest, balance) * 100) / 100;
        const payment = Math.round((interest + principal) * 100) / 100;
        totalPayable = Math.round((totalPayable + payment) * 100) / 100;
        balance = Math.max(0, Math.round((balance - principal) * 100) / 100);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary + Add Repayment button */}
      {schedule && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Summary</h2>
            {isAdmin && (
              <Button asChild size="sm">
                <Link href={`/loans/${loan.id}/repayments/new`}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Repayment
                </Link>
              </Button>
            )}
          </div>
          <AmortizationSummary
            summary={schedule.summary}
            remainingPeriods={remainingPeriods}
            totalPayable={totalPayable}
          />
        </section>
      )}

      <Tabs defaultValue="schedule">
        <TabsList className="mb-4">
          <TabsTrigger value="schedule">Amortization Schedule</TabsTrigger>
          <TabsTrigger value="planning">Amortization Planning</TabsTrigger>
          <TabsTrigger value="history">Repayment History</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          {schedule ? (
            <AmortizationTable periods={schedule.periods} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground text-sm">
              Schedule unavailable.
            </div>
          )}
        </TabsContent>

        <TabsContent value="planning">
          {schedule ? (
            <AmortizationPlanningTab loan={loan} schedule={schedule} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground text-sm">
              Schedule unavailable.
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <RepaymentLog repayments={repayments} loanId={loan.id} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
