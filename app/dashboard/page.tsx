"use client";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { TestBackendBtn } from "../components/TestBackendBtn";
import { Navbar } from "../components/Navbar"; // Poprawiony import
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="flex flex-col items-center justify-center pt-32 pb-12 px-6">
        <div className="w-full max-w-2xl p-12 bg-white rounded-2xl shadow-xl flex flex-col items-center border border-zinc-200">
          <h1 className="text-3xl font-black text-tau-dark mb-2 text-center">
            Witaj, {accounts[0]?.name}!
          </h1>
          <p className="text-zinc-500 mb-8 text-center font-medium">
            Zalogowano pomyślnie
          </p>

          <div className="w-full flex justify-center pt-4 border-t border-zinc-100">
            <TestBackendBtn />
          </div>
        </div>
      </main>
    </div>
  );
}
