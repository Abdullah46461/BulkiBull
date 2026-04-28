import {
  AddWeightInputSchema,
  AuthSessionResponseSchema,
  AuthUserResponseSchema,
  BullDetailResponseSchema,
  BullResponseSchema,
  CreateBullInputSchema,
  EmailVerificationRequiredResponseSchema,
  EmailVerificationResentResponseSchema,
  FeedResponseSchema,
  LoginInputSchema,
  RegisterInputSchema,
  ResendEmailVerificationInputSchema,
  UpdateBullInputSchema,
  UpdateFeedInputSchema,
  WeightRecordResponseSchema,
  type AddWeightInput,
  type AuthSessionResponse,
  type AuthUserResponse,
  type BullDetailResponse,
  type BullResponse,
  type CreateBullInput,
  type EmailVerificationRequiredResponse,
  type EmailVerificationResentResponse,
  type FeedResponse,
  type LoginInput,
  type RegisterInput,
  type ResendEmailVerificationInput,
  type UpdateBullInput,
  type UpdateFeedInput,
  type FeedType,
  type WeightRecordResponse,
} from '@bulki-bull/shared';
import { z } from 'zod';

import { clearAuthToken, getAuthToken } from './authToken';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const API_UNAVAILABLE_MESSAGE = `Не удается связаться с сервером. Проверьте, что API запущен по адресу ${API_URL}.`;

type ApiErrorPayload = {
  message?: string | string[];
  issues?: Array<{
    path: string;
    message: string;
  }>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: ApiErrorPayload,
  ) {
    super(message);
  }
}

const buildUrl = (path: string): string => `${API_URL}${path}`;

const getErrorMessage = (payload: ApiErrorPayload | null, fallback: string): string => {
  if (payload?.issues?.length) {
    return payload.issues.map((issue) => issue.message).join('\n');
  }

  if (Array.isArray(payload?.message)) {
    return payload.message.join('\n');
  }

  return payload?.message ?? fallback;
};

const getSchemaErrorMessage = (error: z.ZodError, fallback: string): string =>
  error.issues.map((issue) => issue.message).join('\n') || fallback;

const parseJsonSafely = (text: string): unknown | null => {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const parseSchema = <T>(schema: z.ZodType<T>, data: unknown, fallback: string): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new Error(getSchemaErrorMessage(result.error, fallback));
  }

  return result.data;
};

const request = async <T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> => {
  const authToken = getAuthToken();
  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(API_UNAVAILABLE_MESSAGE, 0);
  }

  const text = await response.text();
  const data = parseJsonSafely(text);

  if (!response.ok) {
    const payload = data as ApiErrorPayload | null;

    if (response.status === 401) {
      clearAuthToken();
    }

    throw new ApiError(
      getErrorMessage(payload, 'Ошибка запроса'),
      response.status,
      payload ?? undefined,
    );
  }

  if (data === null && text.trim()) {
    throw new Error('Сервер вернул непонятный ответ. Попробуйте еще раз.');
  }

  return parseSchema(schema, data, 'Некорректный ответ сервера');
};

export const api = {
  register(input: RegisterInput): Promise<EmailVerificationRequiredResponse> {
    return request('/auth/register', EmailVerificationRequiredResponseSchema, {
      method: 'POST',
      body: JSON.stringify(parseSchema(RegisterInputSchema, input, 'Проверьте данные формы')),
    });
  },

  resendEmailVerification(
    input: ResendEmailVerificationInput,
  ): Promise<EmailVerificationResentResponse> {
    return request('/auth/verify-email/resend', EmailVerificationResentResponseSchema, {
      method: 'POST',
      body: JSON.stringify(
        parseSchema(ResendEmailVerificationInputSchema, input, 'Проверьте почту'),
      ),
    });
  },

  login(input: LoginInput): Promise<AuthSessionResponse> {
    return request('/auth/login', AuthSessionResponseSchema, {
      method: 'POST',
      body: JSON.stringify(parseSchema(LoginInputSchema, input, 'Проверьте данные формы')),
    });
  },

  me(): Promise<AuthUserResponse> {
    return request('/auth/me', AuthUserResponseSchema);
  },

  async logout(): Promise<void> {
    await request('/auth/logout', z.null(), {
      method: 'POST',
    });
  },

  listBulls(search = ''): Promise<BullResponse[]> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    return request(`/bulls${query}`, z.array(BullResponseSchema));
  },

  getBull(id: string): Promise<BullDetailResponse> {
    return request(`/bulls/${id}`, BullDetailResponseSchema);
  },

  createBull(input: CreateBullInput): Promise<BullDetailResponse> {
    return request('/bulls', BullDetailResponseSchema, {
      method: 'POST',
      body: JSON.stringify(parseSchema(CreateBullInputSchema, input, 'Проверьте данные формы')),
    });
  },

  updateBull(id: string, input: UpdateBullInput): Promise<BullDetailResponse> {
    return request(`/bulls/${id}`, BullDetailResponseSchema, {
      method: 'PATCH',
      body: JSON.stringify(parseSchema(UpdateBullInputSchema, input, 'Проверьте данные формы')),
    });
  },

  async deleteBull(id: string): Promise<void> {
    await request(`/bulls/${id}`, z.null(), {
      method: 'DELETE',
    });
  },

  listWeights(id: string): Promise<WeightRecordResponse[]> {
    return request(`/bulls/${id}/weights`, z.array(WeightRecordResponseSchema));
  },

  addWeight(id: string, input: AddWeightInput): Promise<WeightRecordResponse> {
    return request(`/bulls/${id}/weights`, WeightRecordResponseSchema, {
      method: 'POST',
      body: JSON.stringify(parseSchema(AddWeightInputSchema, input, 'Проверьте данные формы')),
    });
  },

  listFeeds(): Promise<FeedResponse[]> {
    return request('/feeds', z.array(FeedResponseSchema));
  },

  updateFeed(type: FeedType, input: UpdateFeedInput): Promise<FeedResponse> {
    return request(`/feeds/${type}`, FeedResponseSchema, {
      method: 'PUT',
      body: JSON.stringify(parseSchema(UpdateFeedInputSchema, input, 'Проверьте данные формы')),
    });
  },
};
