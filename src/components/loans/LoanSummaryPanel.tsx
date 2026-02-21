import { Loan } from "@/types";
import { formatTHB, formatDate } from "@/lib/utils";
import { computeMonthlyPayment } from "@/lib/amortization";
import { LoanStatusBadge } from "./LoanStatusBadge";

export function LoanSummaryPanel({ loan }: { loan: Loan }) {
  const monthlyPayment = computeMonthlyPayment(
    loan.principal,
    loan.annual_rate,
    loan.term_months
  );

  const fields = [
    { label: "Principal", value: formatTHB(loan.principal) },
    { label: "Monthly Payment", value: formatTHB(monthlyPayment) },
    { label: "Annual Interest Rate", value: `${loan.annual_rate}%` },
    {
      label: "Loan Term",
      value: `${loan.term_value} ${loan.term_unit} (${loan.term_months} months)`,
    },
    { label: "Start Date", value: formatDate(loan.start_date) },
    { label: "First Payment Date", value: formatDate(loan.first_payment_date) },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Loan Details</h2>
        <LoanStatusBadge status={loan.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 text-sm">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="font-medium mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {loan.note && (
        <div className="pt-2 border-t border-border">
          <p className="text-muted-foreground text-xs">Note</p>
          <p className="text-sm mt-1">{loan.note}</p>
        </div>
      )}
    </div>
  );
}
