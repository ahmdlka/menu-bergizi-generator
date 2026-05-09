// Read API base URL from Vite env. Supports both VITE_API_URL and NEXT_PUBLIC_API_URL
// (the latter for parity with the original Next.js convention from GEMINI.md).
const env = (import.meta as any).env ?? {};
export const API_URL: string =
  env.VITE_API_URL || env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
