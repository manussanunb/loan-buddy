import { cookies } from "next/headers";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { LoanCard } from "@/components/loans/LoanCard";
import { Button } from "@/components/ui/button";
import { Loan } from "@/types";
import { Plus } from "lucide-react";

async function getLoans(): Promise<Loan[]> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("lb_session")?.value;

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/loans`, {
    headers: { Cookie: `lb_session=${sessionCookie}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("lb_role")?.value;
  const isAdmin = role === "admin";

  const loans = await getLoans();
  const activeLoans = loans.filter((l) => l.status === "active");
  const paidLoans = loans.filter((l) => l.status === "paid_off");

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loans.length} loan{loans.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/loans/new">
              <Plus className="h-4 w-4 mr-1" />
              New Loan
            </Link>
          </Button>
        )}
      </div>

      {loans.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No loans yet.</p>
          {isAdmin && (
            <Button asChild className="mt-4">
              <Link href="/loans/new">Create your first loan</Link>
            </Button>
          )}
        </div>
      )}

      {activeLoans.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Active ({activeLoans.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </section>
      )}

      {paidLoans.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Paid Off ({paidLoans.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paidLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
