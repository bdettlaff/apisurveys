import { Configuration, LogLevel } from "@azure/msal-browser";

const AZURE_LOGIN_URL = "https://login.microsoftonline.com";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID || "",
    authority: `${AZURE_LOGIN_URL}/${process.env.NEXT_PUBLIC_MSAL_TENANT_ID}`,
    redirectUri:
      process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI || "http://localhost:3000",
  },
  cache: {
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

export const loginRequest = {
  scopes: ["api://d5614add-3e17-42b6-a294-fc218d0f61e6/access_as_user"],
};
