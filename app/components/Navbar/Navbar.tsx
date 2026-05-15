"use client";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { InteractionStatus } from "@azure/msal-browser";
import { Logo } from "../Logo/Logo";

export const Navbar = () => {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

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
        {/* Lewa strona: Logo i Branding */}
        <div className="flex items-center gap-3 min-w-0">
          <Logo width={40} height={40} />
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-sm md:text-lg font-black tracking-tight text-zinc-900 uppercase">
              QUED
            </span>
            <span className="text-[10px] md:text-xs font-bold text-alo-red tracking-[0.2em] uppercase">
              Edukacja
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <button
              onClick={handleLogin}
              disabled={inProgress !== InteractionStatus.None}
              className="px-5 py-2.5 bg-tau-dark text-white rounded-xl text-sm font-bold 
                         transition-all hover:bg-alo-red hover:shadow-lg active:scale-95 
                         whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              {inProgress !== InteractionStatus.None ? "..." : "Zaloguj się"}
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-bold 
                         transition-all hover:bg-zinc-50 active:scale-95 whitespace-nowrap"
            >
              Wyloguj
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
