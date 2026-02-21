"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PinInput } from "@/components/auth/PinInput";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePinComplete(pin: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        toast.error("Incorrect PIN. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">LoanBuddy</h1>
          <p className="text-muted-foreground text-sm">
            Enter your 6-digit PIN to continue
          </p>
        </div>

        <div className="space-y-6">
          <PinInput onComplete={handlePinComplete} disabled={loading} />
          {loading && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Verifying…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
