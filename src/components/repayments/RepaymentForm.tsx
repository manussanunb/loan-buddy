"use client";

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
import { today } from "@/lib/utils";

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  paid_at: z.string().min(1, "Payment date is required"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RepaymentFormProps {
  loanId: string;
  repayment?: Repayment;
}

export function RepaymentForm({ loanId, repayment }: RepaymentFormProps) {
  const router = useRouter();
  const isEdit = !!repayment;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: repayment
      ? { amount: repayment.amount, paid_at: repayment.paid_at, note: repayment.note ?? "" }
      : { paid_at: today() },
  });

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (THB)</Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="5000"
          {...register("amount")}
        />
        {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paid_at">Payment Date</Label>
        <Input id="paid_at" type="date" {...register("paid_at")} />
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
