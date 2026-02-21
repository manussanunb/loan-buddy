import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RepaymentForm } from "@/components/repayments/RepaymentForm";
import { Repayment } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function getRepayment(loanId: string, repaymentId: string, sessionCookie: string): Promise<Repayment | null> {
  const res = await fetch(`${BASE_URL}/api/loans/${loanId}/repayments`, {
    headers: { Cookie: `lb_session=${sessionCookie}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const repayments: Repayment[] = await res.json();
  return repayments.find((r) => r.id === repaymentId) ?? null;
}

export default async function EditRepaymentPage({
  params,
}: {
  params: Promise<{ id: string; repaymentId: string }>;
}) {
  const { id, repaymentId } = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("lb_session")?.value ?? "";

  const repayment = await getRepayment(id, repaymentId, sessionCookie);
  if (!repayment) notFound();

  return (
    <AppShell>
      <PageHeader
        title="Edit Repayment"
        backHref={`/loans/${id}`}
        backLabel="Loan Detail"
      />
      <RepaymentForm loanId={id} repayment={repayment} />
    </AppShell>
  );
}
