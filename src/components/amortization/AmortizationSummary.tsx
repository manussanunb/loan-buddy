import { AmortizationSummaryData } from "@/types";
import { formatTHB } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface AmortizationSummaryProps {
  summary: AmortizationSummaryData;
  remainingPeriods?: number;
  totalPayable?: number;
}

export function AmortizationSummary({ summary, remainingPeriods, totalPayable }: AmortizationSummaryProps) {
  const stats = [
    { label: "Remaining Balance", value: formatTHB(summary.remaining_balance), highlight: !summary.is_paid_off },
    { label: "Total Paid", value: formatTHB(summary.total_paid) },
    { label: "Total Interest Paid", value: formatTHB(summary.total_interest_paid) },
    { label: "Total Principal Paid", value: formatTHB(summary.total_principal_paid) },
    { label: "Total Scheduled", value: formatTHB(summary.total_scheduled) },
    ...(remainingPeriods !== undefined ? [{ label: "Remaining Periods", value: `${remainingPeriods} months` }] : []),
    ...(totalPayable !== undefined ? [{ label: "Total Payable", value: formatTHB(totalPayable) }] : []),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map(({ label, value, highlight }) => (
        <Card key={label} className={highlight ? "border-amber-800/50 bg-amber-950/20" : ""}>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold text-sm mt-1">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
