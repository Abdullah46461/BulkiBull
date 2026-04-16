import {
  AddWeightInputSchema,
  BullDetailResponseSchema,
  BullResponseSchema,
  CreateBullInputSchema,
  UpdateBullInputSchema,
  WeightRecordResponseSchema,
  type AddWeightInput,
  type BullDetailResponse,
  type BullResponse,
  type CreateBullInput,
  type UpdateBullInput,
  type WeightRecordResponse,
} from '@bulki-bull/shared';
import { z } from 'zod';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

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

const parseSchema = <T>(schema: z.ZodType<T>, data: unknown, fallback: string): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new Error(getSchemaErrorMessage(result.error, fallback));
  }

  return result.data;
};

const request = async <T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const payload = data as ApiErrorPayload | null;
    throw new ApiError(
      getErrorMessage(payload, 'Ошибка запроса'),
      response.status,
      payload ?? undefined,
    );
  }

  return parseSchema(schema, data, 'Некорректный ответ сервера');
};

export const api = {
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

  listWeights(id: string): Promise<WeightRecordResponse[]> {
    return request(`/bulls/${id}/weights`, z.array(WeightRecordResponseSchema));
  },

  addWeight(id: string, input: AddWeightInput): Promise<WeightRecordResponse> {
    return request(`/bulls/${id}/weights`, WeightRecordResponseSchema, {
      method: 'POST',
      body: JSON.stringify(parseSchema(AddWeightInputSchema, input, 'Проверьте данные формы')),
    });
  },
};
