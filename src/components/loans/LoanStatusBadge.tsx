import { Badge } from "@/components/ui/badge";
import { LoanStatus } from "@/types";

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return (
    <Badge
      variant={status === "paid_off" ? "secondary" : "default"}
      className={
        status === "paid_off"
          ? "bg-green-900/40 text-green-300 border-green-800"
          : "bg-blue-900/40 text-blue-300 border-blue-800"
      }
    >
      {status === "paid_off" ? "Paid Off" : "Active"}
    </Badge>
  );
}
