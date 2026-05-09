const TOKEN_KEY = "mbg_token";

export const auth = {
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
  isAuthed() {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
