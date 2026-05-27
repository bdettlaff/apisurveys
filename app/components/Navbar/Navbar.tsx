"use client";

import { useState, useEffect } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { InteractionStatus } from "@azure/msal-browser";
import { Logo } from "../Logo/Logo";
import Link from "next/link";

export const Navbar = () => {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleLogin = () => {
    if (inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest).catch((e) => {
        console.error("Błąd logowania z Navbar:", e);
      });
    }
  };

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Logo width={40} height={40} />
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-sm md:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                QED
              </span>
              <span className="text-[10px] md:text-xs font-bold text-alo-red tracking-[0.2em] uppercase">
                Edukacja
              </span>
            </div>
          </div>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-6 border-l border-zinc-200 dark:border-zinc-700 pl-6">
              <Link href="/dashboard" className="text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard/survey-results" className="text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Wyniki ankiet
              </Link>
              <Link href="/dashboard/create-survey" className="text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Stwórz ankietę
              </Link>
              <Link href="/admin/questions" className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                Pytania (Admin)
              </Link>
              <Link href="/admin/surveys" className="text-sm font-bold text-green-600 dark:text-green-400 hover:text-green-700 transition-colors bg-green-50 dark:bg-green-900/30 px-2.5 py-1 rounded-lg border border-green-200/60 dark:border-green-800/60">
                Aktywne ankiety
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2 text-zinc-600 dark:text-zinc-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
          </svg>
        </button>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleDark}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            title="Przełącz motyw"
            aria-label="Przełącz motyw"
          >
            {dark ? "☀" : "🌙"}
          </button>

          {!isAuthenticated ? (
            <button
              onClick={handleLogin}
              disabled={inProgress !== InteractionStatus.None}
              className="px-5 py-2.5 bg-tau-dark text-white rounded-xl text-sm font-bold transition-all hover:bg-alo-red active:scale-95 disabled:opacity-50"
            >
              {inProgress !== InteractionStatus.None ? "..." : "Zaloguj się"}
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95"
            >
              Wyloguj
            </button>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 p-4 flex flex-col gap-4 shadow-xl">
          {isAuthenticated && (
            <>
              <Link href="/dashboard" className="text-sm font-bold text-zinc-600 dark:text-zinc-300 p-2" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link href="/dashboard/survey-results" className="text-sm font-bold text-zinc-600 dark:text-zinc-300 p-2" onClick={() => setIsMenuOpen(false)}>Wyniki ankiet</Link>
              <Link href="/dashboard/create-survey" className="text-sm font-bold text-zinc-600 dark:text-zinc-300 p-2" onClick={() => setIsMenuOpen(false)}>Stwórz ankietę</Link>
              <Link href="/admin/questions" className="text-sm font-bold text-amber-600 dark:text-amber-400 p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-100 dark:border-amber-800/60" onClick={() => setIsMenuOpen(false)}>Pytania (Admin)</Link>
              <Link href="/admin/surveys" className="text-sm font-bold text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-800/60" onClick={() => setIsMenuOpen(false)}>Aktywne ankiety</Link>
            </>
          )}

          <button
            onClick={toggleDark}
            className="w-full px-5 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-bold"
          >
            {dark ? "☀ Tryb jasny" : "🌙 Tryb ciemny"}
          </button>

          {!isAuthenticated ? (
            <button onClick={handleLogin} className="w-full px-5 py-3 bg-tau-dark text-white rounded-xl text-sm font-bold">
              Zaloguj się
            </button>
          ) : (
            <button onClick={handleLogout} className="w-full px-5 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-bold">
              Wyloguj
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
