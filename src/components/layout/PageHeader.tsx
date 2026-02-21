import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, backHref, backLabel = "Back", action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-3">
      {backHref && (
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={backHref}>
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      )}
      <h1 className="text-2xl font-bold tracking-tight flex-1">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
}
