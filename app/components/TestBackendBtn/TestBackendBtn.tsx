"use client";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { useState } from "react";
import { API_CONFIG } from "@/lib/api";

export const TestBackendBtn = () => {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (accounts.length === 0) {
      alert("Musisz być zalogowany, aby przetestować API!");
      return;
    }

    setLoading(true);
    try {
      const authResult = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.test}`,
        {
          headers: {
            Authorization: `Bearer ${authResult.accessToken}`,
          },
        },
      );

      if (!response.ok) throw new Error(`Błąd: ${response.status}`);
      const data = await response.text();
      alert("Odpowiedź ze Springa: " + data);
    } catch (error) {
      console.error(error);
      alert("Brak połączenia. Sprawdź CORS w Springu i czy serwer stoi.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleTest}
      disabled={loading}
      className="mt-4 px-6 py-2 border-2 border-alo-red text-alo-red rounded-xl font-bold hover:bg-alo-red hover:text-white transition-all disabled:opacity-50"
    >
      {loading ? "Łączenie..." : "Sprawdź połączenie ze Springiem"}
    </button>
  );
};
