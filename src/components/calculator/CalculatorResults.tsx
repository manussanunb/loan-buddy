import { AmortizationSchedule } from "@/types";
import { formatTHB } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CalculatorResultsProps {
  result: AmortizationSchedule & {
    monthly_payment: number;
    term_months: number;
    principal: number;
    annual_rate: number;
  };
}

function formatDuration(months: number): string {
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years} year${years !== 1 ? "s" : ""} ${rem} month${rem !== 1 ? "s" : ""}`;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function CalculatorResults({ result }: CalculatorResultsProps) {
  const monthlyRate = result.annual_rate / 100 / 12;

  // Recompute projected rows with a running balance.
  // The engine sets closing_balance = opening_balance for upcoming periods (no repayment),
  // so all rows would show the same balance. We chain them manually instead.
  let balance = result.principal;
  const projectedRows = result.periods.map((p) => {
    const beginningBalance = round2(balance);
    const interest = round2(beginningBalance * monthlyRate);
    const principal = round2(p.scheduled_payment - interest);
    const remainingBalance = round2(Math.max(0, beginningBalance - principal));
    balance = remainingBalance;
    return { period: p.period, beginningBalance, payment: p.scheduled_payment, interest, principal, remainingBalance };
  });

  const summary = [
    { label: "Loan Amount", value: formatTHB(result.principal) },
    { label: "Interest Rate", value: `${result.annual_rate}% / year` },
    { label: "Duration", value: formatDuration(result.term_months) },
    { label: "Monthly Repayment", value: formatTHB(result.monthly_payment) },
    { label: "Total Payable", value: formatTHB(result.summary.total_scheduled) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summary.map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-muted/30 border border-border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold text-sm mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wider">
          Amortization Schedule
        </h3>
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
              {projectedRows.map((row) => (
                <TableRow key={row.period} className="text-sm">
                  <TableCell className="text-center font-mono">{row.period}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(row.beginningBalance)}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(row.payment)}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(row.interest)}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(row.principal)}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(row.remainingBalance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
