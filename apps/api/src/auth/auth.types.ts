import type { AuthUserResponse } from '@bulki-bull/shared';

export type AuthenticatedUser = AuthUserResponse;

export type AuthenticatedRequest = {
  headers: {
    authorization?: string | string[];
  };
  user?: AuthenticatedUser;
  authToken?: string;
};
