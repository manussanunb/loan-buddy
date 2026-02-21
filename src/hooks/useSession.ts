"use client";

import { useEffect, useState } from "react";
import { Role } from "@/types";

function getRoleFromCookie(): Role | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("lb_role="));
  if (!match) return null;
  const role = match.split("=")[1] as Role;
  return role === "admin" || role === "friend" ? role : null;
}

export function useSession() {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setRole(getRoleFromCookie());
    setIsLoading(false);
  }, []);

  return {
    role,
    isAdmin: role === "admin",
    isFriend: role === "friend",
    isLoading,
  };
}
