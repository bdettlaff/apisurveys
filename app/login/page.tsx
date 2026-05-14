"use client";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { InteractionStatus } from "@azure/msal-browser";
import Link from "next/link";

export default function LoginPage() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const handleLogin = () => {
    if (inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest).catch((e) => console.error(e));
    }
  };
  if (isAuthenticated) {
    return (
      <div className="p-8">
        Zalogowano jako {accounts[0].name}.{" "}
        <Link href="/" className="underline">
          Wróć do strony głównej
        </Link>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <button
        onClick={handleLogin}
        className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold"
      >
        Zaloguj przez Microsoft
      </button>
    </div>
  );
}
