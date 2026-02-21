import { AmortizationSchedule } from "@/types";
import { formatTHB } from "@/lib/utils";
import { AmortizationTable } from "@/components/amortization/AmortizationTable";
import { AmortizationSummary } from "@/components/amortization/AmortizationSummary";

interface CalculatorResultsProps {
  result: AmortizationSchedule & { monthly_payment: number; term_months: number };
}

export function CalculatorResults({ result }: CalculatorResultsProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-muted/30 border border-border p-4 flex gap-8">
        <div>
          <p className="text-xs text-muted-foreground">Monthly Payment</p>
          <p className="text-2xl font-bold mt-1">{formatTHB(result.monthly_payment)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Months</p>
          <p className="text-2xl font-bold mt-1">{result.term_months}</p>
        </div>
      </div>

      <AmortizationSummary summary={result.summary} />

      <div>
        <h3 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wider">
          Amortization Schedule
        </h3>
        <AmortizationTable periods={result.periods} />
      </div>
    </div>
  );
}
