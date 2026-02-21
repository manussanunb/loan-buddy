import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RepaymentForm } from "@/components/repayments/RepaymentForm";

export default async function NewRepaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <PageHeader
        title="Add Repayment"
        backHref={`/loans/${id}`}
        backLabel="Loan Detail"
      />
      <RepaymentForm loanId={id} />
    </AppShell>
  );
}
