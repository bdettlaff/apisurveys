import { Configuration, LogLevel } from "@azure/msal-browser";

/**
 * Konfiguracja MSAL, która dynamicznie pobiera dane z .env.local
 */
export const msalConfig: Configuration = {
  auth: {
    // Pobiera Client ID z .env.local
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID || "",

    // Buduje adres authority na podstawie Twojego Tenant ID
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_MSAL_TENANT_ID}`,

    // Adres, na który Microsoft przekieruje po zalogowaniu
    redirectUri:
      process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI || "http://localhost:3000",
  },
  cache: {
    // sessionStorage jest bezpieczniejsze dla aplikacji typu SPA
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

/**
 * Zakresy (Scopes), o które prosimy przy logowaniu.
 * "User.Read" pozwala na pobranie podstawowego profilu użytkownika (imię, nazwisko, email).
 */
export const loginRequest = {
  scopes: ["api://d5614add-3e17-42b6-a294-fc218d0f61e6/access_as_user"],
};
