"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { CalculatorResults } from "@/components/calculator/CalculatorResults";
import { AmortizationSchedule } from "@/types";

type CalcResult = AmortizationSchedule & { monthly_payment: number; term_months: number };

export default function CalculatorPage() {
  const [result, setResult] = useState<CalcResult | null>(null);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Loan Calculator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Results are not saved — for planning purposes only.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div>
          <CalculatorForm onResult={setResult} />
        </div>

        {result && (
          <div>
            <CalculatorResults result={result} />
          </div>
        )}

        {!result && (
          <div className="hidden lg:flex items-center justify-center text-muted-foreground text-sm">
            Enter values and click Calculate to see the amortization schedule.
          </div>
        )}
      </div>
    </AppShell>
  );
}
