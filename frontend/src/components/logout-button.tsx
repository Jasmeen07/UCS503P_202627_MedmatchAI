"use client";

import { useRouter } from "next/navigation";
import { clearUserSession } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await clearUserSession();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium text-[var(--foreground)] hover:text-red-400 transition-colors"
    >
      Logout
    </button>
  );
}
