import Link from "next/link";
import { Repayment } from "@/types";
import { formatTHB, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DeleteRepaymentDialog } from "./DeleteRepaymentDialog";
import { Pencil } from "lucide-react";

interface RepaymentLogProps {
  repayments: Repayment[];
  loanId: string;
  isAdmin: boolean;
}

export function RepaymentLog({ repayments, loanId, isAdmin }: RepaymentLogProps) {
  if (repayments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground text-sm">
        No repayments recorded yet.
      </div>
    );
  }

  // Show newest first
  const sorted = [...repayments].sort(
    (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()
  );

  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border">
      {sorted.map((rep) => (
        <div key={rep.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatTHB(rep.amount)}</span>
              <span className="text-muted-foreground text-sm">{formatDate(rep.paid_at)}</span>
            </div>
            {rep.note && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{rep.note}</p>
            )}
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Link href={`/loans/${loanId}/repayments/${rep.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <DeleteRepaymentDialog loanId={loanId} repaymentId={rep.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
