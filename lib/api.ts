export const API_CONFIG = {
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL}`,
  endpoints: {
    test: "/test",
  },
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL'

export const apiFetch = (path: string, options?: RequestInit) => {
  return fetch(`${API_URL}${path}`, options)
}