"use client";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { InteractionStatus } from "@azure/msal-browser";

export const Hero = () => {
  const { instance, inProgress } = useMsal();
  const handleLogin = () => {
    if (inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest).catch((e) => {
        console.error("Błąd logowania bezpośredniego:", e);
      });
    }
  };
  return (
    <section className="flex flex-col items-center justify-center pt-24 md:pt-32 px-6 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tau-yellow/10 border border-tau-yellow/20 mb-8">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tau-yellow opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-tau-yellow"></span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-tau-dark">
          TAU & ALO
        </span>
      </div>
      <h1 className="text-[clamp(2.5rem,10vw,5rem)] md:text-8xl font-black leading-[1.1] text-school-black mb-8 tracking-tight">
        <span className="italic">Twoja opinia</span> <br />
        <span className="inline-block bg-gradient-to-br from-tau-yellow via-[#ff7e21] to-alo-red bg-clip-text text-transparent italic py-4 -my-4 px-2 -mx-2 drop-shadow-sm">
          zmienia szkołę
        </span>
      </h1>
      <p className="max-w-xl text-school-gray text-lg md:text-xl mb-12 leading-relaxed font-medium">
        Twoja opinia kształtuje naszą szkołę. Zaloguj się, aby anonimowo ocenić
        pracę nauczycieli i pomóc nam tworzyć lepsze warunki do nauki. Twój głos
        ma znaczenie!
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <button
          onClick={handleLogin}
          disabled={inProgress !== InteractionStatus.None}
          className="group px-8 py-4 bg-tau-dark text-white rounded-2xl font-bold text-lg transition-all hover:bg-alo-red hover:shadow-xl hover:shadow-alo-red/20 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {inProgress !== InteractionStatus.None
            ? "Łączenie..."
            : "Rozpocznij teraz"}
          <svg
            className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </section>
  );
};
