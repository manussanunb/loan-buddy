"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AmortizationSchedule, CalculatorMode } from "@/types";

const fixedTermSchema = z.object({
  principal: z.coerce.number().positive(),
  annual_rate: z.coerce.number().positive().max(100),
  term_value: z.coerce.number().int().positive(),
  term_unit: z.enum(["months", "years"]),
});

const fixedPaymentSchema = z.object({
  principal: z.coerce.number().positive(),
  annual_rate: z.coerce.number().positive().max(100),
  monthly_payment: z.coerce.number().positive(),
});

interface CalculatorFormProps {
  onResult: (result: AmortizationSchedule & { monthly_payment: number; term_months: number; principal: number; annual_rate: number }) => void;
}

export function CalculatorForm({ onResult }: CalculatorFormProps) {
  const [mode, setMode] = useState<CalculatorMode>("fixed_term");

  const termForm = useForm({ resolver: zodResolver(fixedTermSchema), defaultValues: { term_unit: "months" } });
  const paymentForm = useForm({ resolver: zodResolver(fixedPaymentSchema) });

  async function handleFixedTerm(values: z.infer<typeof fixedTermSchema>) {
    const termMonths = values.term_unit === "years" ? values.term_value * 12 : values.term_value;
    const res = await fetch("/api/calculator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "fixed_term", principal: values.principal, annual_rate: values.annual_rate, term_months: termMonths }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Calculation failed");
      return;
    }
    onResult({ ...(await res.json()), principal: values.principal, annual_rate: values.annual_rate });
  }

  async function handleFixedPayment(values: z.infer<typeof fixedPaymentSchema>) {
    const res = await fetch("/api/calculator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "fixed_payment", principal: values.principal, annual_rate: values.annual_rate, monthly_payment: values.monthly_payment }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Calculation failed");
      return;
    }
    onResult({ ...(await res.json()), principal: values.principal, annual_rate: values.annual_rate });
  }

  return (
    <div className="space-y-5 max-w-md">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        {(["fixed_term", "fixed_payment"] as CalculatorMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "fixed_term" ? "Fixed Term" : "Fixed Payment"}
          </button>
        ))}
      </div>

      {mode === "fixed_term" ? (
        <form onSubmit={termForm.handleSubmit(handleFixedTerm)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Principal (THB)</Label>
            <Input type="number" min="1" step="0.01" placeholder="100000" {...termForm.register("principal")} />
          </div>
          <div className="space-y-1.5">
            <Label>Annual Interest Rate (%)</Label>
            <Input type="number" min="0" max="100" step="0.01" placeholder="7.5" {...termForm.register("annual_rate")} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>Loan Term</Label>
              <Input type="number" min="1" placeholder="12" {...termForm.register("term_value")} />
            </div>
            <div className="w-32 space-y-1.5">
              <Label>Unit</Label>
              <Select
                defaultValue="months"
                onValueChange={(v) => termForm.setValue("term_unit", v as "months" | "years")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={termForm.formState.isSubmitting}>
            {termForm.formState.isSubmitting ? "Calculating…" : "Calculate"}
          </Button>
        </form>
      ) : (
        <form onSubmit={paymentForm.handleSubmit(handleFixedPayment)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Principal (THB)</Label>
            <Input type="number" min="1" step="0.01" placeholder="100000" {...paymentForm.register("principal")} />
          </div>
          <div className="space-y-1.5">
            <Label>Annual Interest Rate (%)</Label>
            <Input type="number" min="0" max="100" step="0.01" placeholder="7.5" {...paymentForm.register("annual_rate")} />
          </div>
          <div className="space-y-1.5">
            <Label>Monthly Payment (THB)</Label>
            <Input type="number" min="1" step="0.01" placeholder="5000" {...paymentForm.register("monthly_payment")} />
          </div>
          <Button type="submit" className="w-full" disabled={paymentForm.formState.isSubmitting}>
            {paymentForm.formState.isSubmitting ? "Calculating…" : "Calculate"}
          </Button>
        </form>
      )}
    </div>
  );
}
