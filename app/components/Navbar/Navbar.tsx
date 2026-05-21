"use client";

import { useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { InteractionStatus } from "@azure/msal-browser";
import { Logo } from "../Logo/Logo";
import Link from "next/link";

export const Navbar = () => {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = () => {
    if (inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest).catch((e) => {
        console.error("Błąd logowania z Navbar:", e);
      });
    }
  };

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Logo width={40} height={40} />
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-sm md:text-lg font-black tracking-tight text-zinc-900 uppercase">
                QED
              </span>
              <span className="text-[10px] md:text-xs font-bold text-alo-red tracking-[0.2em] uppercase">
                Edukacja
              </span>
            </div>
          </div>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-6 border-l border-zinc-200 pl-6">
              <Link
                href="/dashboard"
                className="text-sm font-bold text-zinc-600 hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/survey-results"
                className="text-sm font-bold text-zinc-600 hover:text-indigo-600 transition-colors"
              >
                Wyniki ankiet
              </Link>
              <Link
                href="/dashboard/create-survey"
                className="text-sm font-bold text-zinc-600 hover:text-indigo-600 transition-colors"
              >
                Stwórz ankietę
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2 text-zinc-600"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
            />
          </svg>
        </button>

        <div className="hidden md:flex items-center gap-4">
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
              className="px-5 py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-bold transition-all hover:bg-zinc-50 active:scale-95"
            >
              Wyloguj
            </button>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-zinc-100 p-4 flex flex-col gap-4 shadow-xl">
          {isAuthenticated && (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-bold text-zinc-600 p-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/survey-results"
                className="text-sm font-bold text-zinc-600 p-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Wyniki ankiet
              </Link>
              <Link
                href="/dashboard/create-survey"
                className="text-sm font-bold text-zinc-600 p-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Stwórz ankietę
              </Link>
            </>
          )}
          {!isAuthenticated ? (
            <button
              onClick={handleLogin}
              className="w-full px-5 py-3 bg-tau-dark text-white rounded-xl text-sm font-bold"
            >
              Zaloguj się
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full px-5 py-3 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-bold"
            >
              Wyloguj
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
