import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoanForm } from "@/components/loans/LoanForm";
import { Loan } from "@/types";

async function getLoan(id: string): Promise<Loan | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("lb_session")?.value;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/loans/${id}`,
    { headers: { Cookie: `lb_session=${sessionCookie}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function EditLoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loan = await getLoan(id);
  if (!loan) notFound();

  return (
    <AppShell>
      <PageHeader
        title="Edit Loan"
        backHref={`/loans/${id}`}
        backLabel="Loan Detail"
      />
      <LoanForm loan={loan} />
    </AppShell>
  );
}
