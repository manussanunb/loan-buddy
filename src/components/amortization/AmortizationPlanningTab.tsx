import { Loan, AmortizationSchedule } from "@/types";
import { formatTHB } from "@/lib/utils";
import { computeMonthlyPayment } from "@/lib/amortization";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  loan: Loan;
  schedule: AmortizationSchedule;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function AmortizationPlanningTab({ loan, schedule }: Props) {
  const remainingBalance = schedule.summary.remaining_balance;
  const monthlyRate = loan.annual_rate / 100 / 12;

  // Find the first unpaid/partial/overdue period index (0-based)
  const currentPeriodIndex = schedule.periods.findIndex(
    (p) => p.status !== "paid"
  );

  // Number of remaining periods
  const remainingPeriods =
    currentPeriodIndex === -1 ? 0 : schedule.periods.length - currentPeriodIndex;

  if (remainingBalance <= 0 || remainingPeriods === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground text-sm">
        This loan is fully paid off — no remaining schedule.
      </div>
    );
  }

  // Recompute monthly payment for the remaining balance over remaining periods
  const monthlyPayment = computeMonthlyPayment(loan.principal, loan.annual_rate, loan.term_months);

  // Project rows forward from the remaining balance
  let balance = remainingBalance;
  const rows = Array.from({ length: remainingPeriods }, (_, i) => {
    const periodNumber = (currentPeriodIndex === -1 ? 0 : currentPeriodIndex) + i + 1;
    const beginningBalance = round2(balance);
    const interest = round2(beginningBalance * monthlyRate);
    const principal = round2(Math.min(monthlyPayment - interest, beginningBalance));
    const payment = round2(interest + principal);
    const remainingBal = round2(Math.max(0, beginningBalance - principal));
    balance = remainingBal;
    return { periodNumber, beginningBalance, payment, interest, principal, remainingBal };
  });

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border overflow-auto max-h-[600px]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="text-right">Beginning Balance</TableHead>
              <TableHead className="text-right">Payment</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Remaining Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.periodNumber} className="text-sm">
                <TableCell className="text-center font-mono">{row.periodNumber}</TableCell>
                <TableCell className="text-right font-mono">{formatTHB(row.beginningBalance)}</TableCell>
                <TableCell className="text-right font-mono">{formatTHB(row.payment)}</TableCell>
                <TableCell className="text-right font-mono">{formatTHB(row.interest)}</TableCell>
                <TableCell className="text-right font-mono">{formatTHB(row.principal)}</TableCell>
                <TableCell className="text-right font-mono">{formatTHB(row.remainingBal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
