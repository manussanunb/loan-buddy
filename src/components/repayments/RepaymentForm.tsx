"use client";

import { useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Repayment } from "@/types";
import { formatTHB } from "@/lib/utils";

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  paid_at: z.string().min(1, "Payment date is required"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RepaymentFormProps {
  loanId: string;
  repayment?: Repayment;
  // New repayment only — context for the on-schedule mode
  currentPeriodDueDate?: string | null;
  monthlyPayment?: number | null;
}

export function RepaymentForm({ loanId, repayment, currentPeriodDueDate, monthlyPayment }: RepaymentFormProps) {
  const router = useRouter();
  const isEdit = !!repayment;

  // "schedule" = on-schedule payment for current period
  // "manual"   = custom date (extra / prepayment)
  const [mode, setMode] = useState<"schedule" | "manual">("schedule");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: repayment
      ? { amount: repayment.amount, paid_at: repayment.paid_at, note: repayment.note ?? "" }
      : {
          paid_at: currentPeriodDueDate ?? new Date().toISOString().split("T")[0],
          amount: monthlyPayment ?? undefined,
        },
  });

  function switchMode(next: "schedule" | "manual") {
    setMode(next);
    if (next === "schedule") {
      setValue("paid_at", currentPeriodDueDate ?? new Date().toISOString().split("T")[0]);
      if (monthlyPayment) setValue("amount", monthlyPayment);
    } else {
      setValue("paid_at", new Date().toISOString().split("T")[0]);
      setValue("amount", 0 as unknown as number);
    }
  }

  async function onSubmit(values: FormValues) {
    const url = isEdit
      ? `/api/loans/${loanId}/repayments/${repayment.id}`
      : `/api/loans/${loanId}/repayments`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to save repayment");
      return;
    }

    toast.success(isEdit ? "Repayment updated" : "Repayment recorded");
    router.push(`/loans/${loanId}`);
    router.refresh();
  }

  const showModeSwitcher = !isEdit && currentPeriodDueDate != null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">

      {/* Mode switcher — only on new repayment when we have schedule context */}
      {showModeSwitcher && (
        <div className="space-y-1.5">
          <Label>Payment Type</Label>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => switchMode("schedule")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "schedule"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              On Schedule
            </button>
            <button
              type="button"
              onClick={() => switchMode("manual")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "manual"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              Manual
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === "schedule"
              ? `On-schedule payment for the current period (due ${currentPeriodDueDate}). Amount is pre-filled with the monthly repayment and distributes to interest then principal.`
              : "Enter a custom date and amount. Payment will go directly toward reducing the principal."}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (THB)</Label>
        {mode === "schedule" && monthlyPayment && (
          <p className="text-xs text-muted-foreground">Monthly repayment: {formatTHB(monthlyPayment)}</p>
        )}
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="5000"
          readOnly={mode === "schedule"}
          className={mode === "schedule" ? "bg-muted/30 cursor-not-allowed" : ""}
          {...register("amount")}
        />
        {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paid_at">Payment Date</Label>
        <Input
          id="paid_at"
          type="date"
          readOnly={mode === "schedule"}
          className={mode === "schedule" ? "bg-muted/30 cursor-not-allowed" : ""}
          {...register("paid_at")}
        />
        {errors.paid_at && <p className="text-destructive text-xs">{errors.paid_at.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" placeholder="Any notes about this payment…" rows={2} {...register("note")} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : isEdit ? "Update Repayment" : "Record Repayment"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
