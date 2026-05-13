"use client";
import Image from "next/image";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { InteractionStatus } from "@azure/msal-browser";

export default function Home() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = () => {
    // Używamy redirect zamiast popup, aby uniknąć blokowania okien przez przeglądarkę
    if (inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest).catch((e) => {
        console.error("Błąd podczas przekierowania do logowania:", e);
      });
    }
  };

  const testSpringConnection = async () => {
    if (accounts.length === 0) return;

    try {
      // Pobieranie tokenu po cichu (z pamięci podręcznej przeglądarki)
      const authResult = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      // fetch do backendu w Spring Boot
      const response = await fetch("http://localhost:8080/api/test", {
        headers: {
          Authorization: `Bearer ${authResult.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Błąd API: ${response.status}`);
      }

      const text = await response.text();
      alert("Odpowiedź ze Springa: " + text);
    } catch (e) {
      console.error("Błąd połączenia z API:", e);
      alert(
        "Błąd połączenia! Upewnij się, że Spring Boot działa i ma skonfigurowany CORS.",
      );
    }
  };

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-8">
      <main className="w-full max-w-2xl p-12 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col items-center border border-zinc-200 dark:border-zinc-800">
        <Image
          className="dark:invert mb-10"
          src="/next.svg"
          alt="Next.js logo"
          width={120}
          height={24}
          priority
        />

        <div className="text-center sm:text-left w-full">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-6">
            {isAuthenticated
              ? `Witaj, ${accounts[0].name}!`
              : "Panel Użytkownika"}
          </h1>

          {/**
           * Logika renderowania interfejsu logowania:
           * 1. Wyświetla loader podczas aktywnej interakcji z MSAL (inProgress).
           * 2. Jeśli użytkownik nie jest zalogowany, wyświetla zachętę i przycisk logowania.
           * 3. Jeśli użytkownik jest zalogowany, (renderowana jest dalsza część komponentu).
           *   Sekcja autoryzacji:
              - inProgress: Obsługuje stany 'login', 'logout' i 'acquireToken' (zapobiega konfliktom sesji)
              - !isAuthenticated: Blokada dostępu do API dla niezalogowanych użytkowników
           */}

          {inProgress !== InteractionStatus.None ? (
            <div className="flex items-center justify-center gap-2 text-blue-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p>Łączenie z usługą Microsoft...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-zinc-500 mb-4">
                Zaloguj się, aby uzyskać dostęp do API.
              </p>
              <button
                onClick={handleLogin}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                Zaloguj przez Microsoft
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                ✅ Pomyślnie połączono z Azure AD
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={testSpringConnection}
                  className="flex-1 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Testuj API (Spring)
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Wyloguj
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-8 text-zinc-400 text-xs">
        Status MSAL: {inProgress}
      </footer>
    </div>
  );
}
