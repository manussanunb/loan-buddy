import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoanForm } from "@/components/loans/LoanForm";

export default function NewLoanPage() {
  return (
    <AppShell>
      <PageHeader title="New Loan" backHref="/dashboard" backLabel="Dashboard" />
      <LoanForm />
    </AppShell>
  );
}
