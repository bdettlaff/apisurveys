"use client";

import { useEffect, useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useRouter } from "next/navigation";
import { apiFetch } from '@/lib/api'

type CurrentUser = {
  id: number;
  login: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
};

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        if (
          !isAuthenticated ||
          accounts.length === 0 ||
          inProgress !== InteractionStatus.None
        ) {
          return;
        }

        const authResult = await instance.acquireTokenSilent({
          scopes: ["api://d5614add-3e17-42b6-a294-fc218d0f61e6/access_as_user"],
          account: accounts[0],
        });

        const res = await fetch(`${API_URL}/api/v1/me`, {
          headers: {
            Authorization: `Bearer ${authResult.accessToken}`,
          },
        });

        if (!res.ok) {
          router.push("/dashboard");
          return;
        }

        const data: CurrentUser = await res.json();

        if (data.role !== "ADMIN") {
          router.push("/dashboard");
          return;
        }

        setLoading(false);
      } catch (e) {
        console.error("Błąd sprawdzania roli:", e);
        router.push("/dashboard");
      }
    };

    checkRole();
  }, [isAuthenticated, accounts, inProgress, instance, router]);

  // ← BEZ AdminGuard w środku!
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500 font-bold">
        Sprawdzanie uprawnień...
      </div>
    );
  }

  return <>{children}</>;
}
