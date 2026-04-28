import type {
  AuthUserResponse,
  EmailVerificationRequiredResponse,
  EmailVerificationResentResponse,
  LoginInput,
  RegisterInput,
  ResendEmailVerificationInput,
} from '@bulki-bull/shared';
import { readonly, ref } from 'vue';

import { api } from './api';
import { clearAuthToken, getAuthToken, setAuthToken } from './authToken';

const currentUser = ref<AuthUserResponse | null>(null);
const authReady = ref(false);
let pendingAuthCheck: Promise<AuthUserResponse | null> | null = null;

const saveSession = (token: string, user: AuthUserResponse): AuthUserResponse => {
  setAuthToken(token);
  currentUser.value = user;
  authReady.value = true;

  return user;
};

export const hasStoredAuthToken = (): boolean => Boolean(getAuthToken());

export const ensureAuth = async (): Promise<AuthUserResponse | null> => {
  if (!getAuthToken()) {
    currentUser.value = null;
    authReady.value = true;
    return null;
  }

  if (currentUser.value) {
    authReady.value = true;
    return currentUser.value;
  }

  if (!pendingAuthCheck) {
    pendingAuthCheck = api
      .me()
      .then((user) => {
        currentUser.value = user;
        authReady.value = true;
        return user;
      })
      .catch(() => {
        clearAuthToken();
        currentUser.value = null;
        authReady.value = true;
        return null;
      })
      .finally(() => {
        pendingAuthCheck = null;
      });
  }

  return pendingAuthCheck;
};

export const register = (input: RegisterInput): Promise<EmailVerificationRequiredResponse> =>
  api.register(input);

export const resendEmailVerification = (
  input: ResendEmailVerificationInput,
): Promise<EmailVerificationResentResponse> => api.resendEmailVerification(input);

export const login = async (input: LoginInput): Promise<AuthUserResponse> => {
  const session = await api.login(input);
  return saveSession(session.token, session.user);
};

export const logout = async (): Promise<void> => {
  try {
    if (getAuthToken()) {
      await api.logout();
    }
  } finally {
    clearAuthToken();
    currentUser.value = null;
    authReady.value = true;
  }
};

export const authState = {
  currentUser: readonly(currentUser),
  authReady: readonly(authReady),
};
