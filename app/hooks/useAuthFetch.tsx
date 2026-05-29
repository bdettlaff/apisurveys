"use client";

import { useCallback } from "react";
import { useMsal } from "@azure/msal-react";

export function useAuthFetch() {
  const { instance, accounts } = useMsal();

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      let currentAccounts = accounts;

      // Jeśli konta nie są jeszcze załadowane, poczekaj chwilę
      if (currentAccounts.length === 0) {
        currentAccounts = instance.getAllAccounts();
      }

      if (currentAccounts.length === 0) {
        throw new Error("Użytkownik nie jest zalogowany.");
      }

      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ["api://d5614add-3e17-42b6-a294-fc218d0f61e6/access_as_user"],
        account: currentAccounts[0],
      });

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${tokenResponse.accessToken}`,
          "Content-Type": "application/json",
        },
      });
    },
    [instance, accounts],
  );

  return authFetch;
}
