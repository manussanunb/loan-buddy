import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loan } from "@/types";
import { formatTHB, formatDate } from "@/lib/utils";
import { computeMonthlyPayment } from "@/lib/amortization";
import { LoanStatusBadge } from "./LoanStatusBadge";

interface LoanCardProps {
  loan: Loan;
}

export function LoanCard({ loan }: LoanCardProps) {
  const monthlyPayment = computeMonthlyPayment(
    loan.principal,
    loan.annual_rate,
    loan.term_months
  );

  return (
    <Link href={`/loans/${loan.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight">{loan.name}</h3>
            <LoanStatusBadge status={loan.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Principal</p>
              <p className="font-medium">{formatTHB(loan.principal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Monthly Payment</p>
              <p className="font-medium">{formatTHB(monthlyPayment)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Term</p>
              <p className="font-medium">
                {loan.term_value} {loan.term_unit}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Rate</p>
              <p className="font-medium">{loan.annual_rate}% p.a.</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">Start Date</p>
              <p className="font-medium">{formatDate(loan.start_date)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
