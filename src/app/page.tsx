import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function RootPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("lb_role")?.value;
  if (role === "admin" || role === "friend") {
    redirect("/dashboard");
  }
  redirect("/login");
}
