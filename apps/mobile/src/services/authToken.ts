const AUTH_TOKEN_STORAGE_KEY = 'bulki-bull.authToken';

export const getAuthToken = (): string | null =>
  window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

export const setAuthToken = (token: string): void => {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearAuthToken = (): void => {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};
