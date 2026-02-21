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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loan } from "@/types";
import { computeMonthlyPayment } from "@/lib/amortization";
import { formatTHB } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  principal: z.coerce.number().positive("Must be positive"),
  annual_rate: z.coerce.number().positive("Must be positive").max(100),
  term_value: z.coerce.number().int().positive("Must be positive"),
  term_unit: z.enum(["months", "years"]),
  start_date: z.string().min(1, "Start date is required"),
  first_payment_date: z.string().min(1, "First payment date is required"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LoanFormProps {
  loan?: Loan;
}

export function LoanForm({ loan }: LoanFormProps) {
  const router = useRouter();
  const isEdit = !!loan;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: loan
      ? {
          name: loan.name,
          principal: loan.principal,
          annual_rate: loan.annual_rate,
          term_value: loan.term_value,
          term_unit: loan.term_unit,
          start_date: loan.start_date,
          first_payment_date: loan.first_payment_date,
          note: loan.note ?? "",
        }
      : {
          term_unit: "months",
        },
  });

  const [principal, annualRate, termValue, termUnit] = watch([
    "principal",
    "annual_rate",
    "term_value",
    "term_unit",
  ]);

  const termMonths =
    termUnit === "years" ? (termValue || 0) * 12 : termValue || 0;
  const monthlyPayment =
    principal && annualRate && termMonths
      ? computeMonthlyPayment(Number(principal), Number(annualRate), termMonths)
      : null;

  async function onSubmit(values: FormValues) {
    const url = isEdit ? `/api/loans/${loan.id}` : "/api/loans";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to save loan");
      return;
    }

    const saved = await res.json();
    toast.success(isEdit ? "Loan updated" : "Loan created");
    router.push(`/loans/${saved.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="name">Loan Name</Label>
        <Input id="name" placeholder="e.g. Car loan May 2025" {...register("name")} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="principal">Principal Amount (THB)</Label>
        <Input id="principal" type="number" min="0" step="0.01" placeholder="100000" {...register("principal")} />
        {errors.principal && <p className="text-destructive text-xs">{errors.principal.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="annual_rate">Annual Interest Rate (%)</Label>
        <Input id="annual_rate" type="number" min="0" max="100" step="0.01" placeholder="7.5" {...register("annual_rate")} />
        {errors.annual_rate && <p className="text-destructive text-xs">{errors.annual_rate.message}</p>}
      </div>

      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="term_value">Loan Term</Label>
          <Input id="term_value" type="number" min="1" placeholder="12" {...register("term_value")} />
          {errors.term_value && <p className="text-destructive text-xs">{errors.term_value.message}</p>}
        </div>
        <div className="w-32 space-y-1.5">
          <Label>Unit</Label>
          <Select
            defaultValue={loan?.term_unit ?? "months"}
            onValueChange={(v) => setValue("term_unit", v as "months" | "years")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start Date</Label>
          <Input id="start_date" type="date" {...register("start_date")} />
          {errors.start_date && <p className="text-destructive text-xs">{errors.start_date.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="first_payment_date">First Payment Date</Label>
          <Input id="first_payment_date" type="date" {...register("first_payment_date")} />
          {errors.first_payment_date && (
            <p className="text-destructive text-xs">{errors.first_payment_date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" placeholder="Any additional details..." rows={3} {...register("note")} />
      </div>

      {monthlyPayment !== null && (
        <div className="rounded-lg bg-muted/50 p-4 border border-border">
          <p className="text-sm text-muted-foreground">Estimated monthly payment</p>
          <p className="text-2xl font-bold mt-1">{formatTHB(monthlyPayment)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {termMonths} months × {formatTHB(monthlyPayment)} = {formatTHB(monthlyPayment * termMonths)} total
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : isEdit ? "Update Loan" : "Create Loan"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
