"use client";

import { useState } from "react";
import { AmortizationPeriod } from "@/types";
import { formatTHB, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusConfig: Record<
  AmortizationPeriod["status"],
  { rowClass: string; badgeLabel: string; badgeClass: string }
> = {
  paid: {
    rowClass: "bg-green-950/30 hover:bg-green-950/40",
    badgeLabel: "Paid",
    badgeClass: "bg-green-900/40 text-green-300 border-green-800",
  },
  partial: {
    rowClass: "bg-amber-950/30 hover:bg-amber-950/40",
    badgeLabel: "Partial",
    badgeClass: "bg-amber-900/40 text-amber-300 border-amber-800",
  },
  overdue: {
    rowClass: "bg-red-950/30 hover:bg-red-950/40",
    badgeLabel: "Overdue",
    badgeClass: "bg-red-900/40 text-red-300 border-red-800",
  },
  upcoming: {
    rowClass: "hover:bg-muted/30",
    badgeLabel: "Upcoming",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
};

interface AmortizationTableProps {
  periods: AmortizationPeriod[];
}

export function AmortizationTable({ periods }: AmortizationTableProps) {
  const [showAll, setShowAll] = useState(false);

  const unpaidPeriods = periods.filter((p) => p.status !== "paid");
  const displayed = showAll ? periods : unpaidPeriods;
  const hiddenCount = periods.length - unpaidPeriods.length;

  return (
    <div className="space-y-2">
      {hiddenCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {showAll
              ? `Showing all ${periods.length} periods`
              : `Showing ${unpaidPeriods.length} unpaid period${unpaidPeriods.length !== 1 ? "s" : ""} — ${hiddenCount} paid hidden`}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show unpaid only" : "Show all"}
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-auto max-h-[600px]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-12 text-center sticky left-0 bg-background">#</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Beginning Balance</TableHead>
              <TableHead className="text-right">Scheduled</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Closing Balance</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.map((p) => {
              const cfg = statusConfig[p.status];
              return (
                <TableRow key={p.period} className={cn("text-sm", cfg.rowClass)}>
                  <TableCell className={cn("text-center font-mono sticky left-0", cfg.rowClass)}>
                    {p.period}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(p.due_date)}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(p.opening_balance)}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(p.scheduled_payment)}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(p.actual_payment)}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(p.interest_paid)}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(p.principal_paid)}</TableCell>
                  <TableCell className="text-right font-mono">{formatTHB(p.closing_balance)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn("text-xs", cfg.badgeClass)}>
                      {cfg.badgeLabel}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {displayed.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-6 text-sm">
                  No unpaid periods.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
