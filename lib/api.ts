export const API_CONFIG = {
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api`,
  endpoints: {
    test: "/test",
  },
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const apiFetch = (path: string, options?: RequestInit) => {
  return fetch(`${API_URL}${path}`, options)
}