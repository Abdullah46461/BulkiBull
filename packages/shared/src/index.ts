import { z } from 'zod';

export const APP_NAME = 'Bulki Bull';

export type ApiHealth = {
  status: 'ok';
  service: 'api';
  database: 'ok';
};

export const bullSexValues = ['MALE', 'FEMALE', 'UNKNOWN'] as const;

export const BullSexSchema = z.enum(bullSexValues);

export type BullSex = z.infer<typeof BullSexSchema>;

export const bullBreedValues = [
  'Абердин-ангусская',
  'Герефордская',
  'Калмыцкая',
  'Казахская белоголовая',
  'Русская комолая',
  'Симментальская',
  'Шаролезская',
  'Лимузинская',
  'Шортгорнская',
] as const;

export type BullBreed = (typeof bullBreedValues)[number];

export const feedTypeValues = ['hay', 'compound_feed'] as const;

export const FeedTypeSchema = z.enum(feedTypeValues);

export type FeedType = z.infer<typeof FeedTypeSchema>;

export const AUTH_PASSWORD_MIN_LENGTH = 15;
export const AUTH_PASSWORD_MAX_LENGTH = 128;

const authEmailSchema = z
  .string()
  .trim()
  .min(1, 'Укажите почту.')
  .max(254, 'Почта слишком длинная.')
  .email('Укажите корректную почту.')
  .transform((value) => value.toLowerCase());

const authPasswordSchema = z
  .string()
  .min(
    AUTH_PASSWORD_MIN_LENGTH,
    `Пароль должен быть не короче ${AUTH_PASSWORD_MIN_LENGTH} символов.`,
  )
  .max(
    AUTH_PASSWORD_MAX_LENGTH,
    `Пароль должен быть не длиннее ${AUTH_PASSWORD_MAX_LENGTH} символов.`,
  );

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const optionalTextSchema = (max: number) =>
  z.preprocess(emptyStringToUndefined, z.union([z.string().trim().max(max), z.null()]).optional());

export const PHOTO_REMOTE_URL_MAX_LENGTH = 8192;
export const PHOTO_DATA_URL_MAX_LENGTH = 350_000;

const isPhotoDataUrl = (value: string): boolean => value.startsWith('data:image/');

const isValidAbsoluteUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:', 'data:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const photoStringSchema = z
  .string()
  .trim()
  .refine(isValidAbsoluteUrl, {
    message: 'Укажите корректное фото.',
  })
  .superRefine((value, ctx) => {
    if (isPhotoDataUrl(value)) {
      if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Фото из галереи повреждено. Выберите его заново.',
        });
      }

      if (value.length > PHOTO_DATA_URL_MAX_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Фото слишком большое. Максимум ${PHOTO_DATA_URL_MAX_LENGTH} символов после сжатия.`,
        });
      }

      return;
    }

    if (value.length > PHOTO_REMOTE_URL_MAX_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Ссылка на фото слишком длинная. Максимум ${PHOTO_REMOTE_URL_MAX_LENGTH} символов.`,
      });
    }
  });

const optionalUrlSchema = z.preprocess(
  emptyStringToUndefined,
  z.union([photoStringSchema, z.null()]).optional(),
);

const dateStringSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      const timestamp = Date.parse(value);
      return Number.isFinite(timestamp);
    },
    {
      message: 'Укажите корректную дату.',
    },
  );

const pastOrTodayDateStringSchema = dateStringSchema.refine(
  (value) => {
    const date = new Date(value);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    return date.getTime() <= todayEnd.getTime();
  },
  {
    message: 'Дата не может быть в будущем.',
  },
);

const weightKgSchema = z.coerce
  .number()
  .positive({
    message: 'Вес должен быть больше 0.',
  })
  .max(2000, {
    message: 'Вес выглядит слишком большим для бычка.',
  });

const stockKgSchema = z.coerce
  .number()
  .nonnegative({
    message: 'Остаток должен быть 0 или больше.',
  })
  .max(1_000_000, {
    message: 'Остаток выглядит слишком большим.',
  });

const feedConsumptionKgSchema = z.coerce
  .number()
  .nonnegative({
    message: 'Расход на голову должен быть 0 или больше.',
  })
  .max(100, {
    message: 'Расход на голову выглядит слишком большим.',
  });

export const CreateBullInputSchema = z
  .object({
    tagNumber: z.string().trim().min(1, 'Укажите бирку.').max(50),
    name: optionalTextSchema(100),
    birthDate: pastOrTodayDateStringSchema,
    breed: optionalTextSchema(100),
    sex: BullSexSchema,
    arrivalDate: pastOrTodayDateStringSchema,
    initialWeight: weightKgSchema,
    photoUrl: optionalUrlSchema,
    notes: optionalTextSchema(2000),
  })
  .strict();

export const UpdateBullInputSchema = CreateBullInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one field is required.',
  },
);

export const AddWeightInputSchema = z
  .object({
    date: pastOrTodayDateStringSchema,
    weight: weightKgSchema,
    comment: optionalTextSchema(1000),
  })
  .strict();

export const ListBullsQuerySchema = z
  .object({
    search: optionalTextSchema(50),
  })
  .strict();

export const UpdateFeedInputSchema = z
  .object({
    currentStockKg: stockKgSchema,
    consumptionPerBullPerDayKg: feedConsumptionKgSchema,
  })
  .strict();

export const RegisterInputSchema = z
  .object({
    email: authEmailSchema,
    password: authPasswordSchema,
  })
  .strict();

export const LoginInputSchema = z
  .object({
    email: authEmailSchema,
    password: z
      .string()
      .min(1, 'Укажите пароль.')
      .max(
        AUTH_PASSWORD_MAX_LENGTH,
        `Пароль должен быть не длиннее ${AUTH_PASSWORD_MAX_LENGTH} символов.`,
      ),
  })
  .strict();

export const ResendEmailVerificationInputSchema = z
  .object({
    email: authEmailSchema,
  })
  .strict();

export const WeightRecordResponseSchema = z.object({
  id: z.string(),
  bullId: z.string(),
  date: z.string(),
  weight: z.number(),
  comment: z.string().nullable(),
  createdAt: z.string(),
});

export const BullResponseSchema = z.object({
  id: z.string(),
  tagNumber: z.string(),
  name: z.string().nullable(),
  birthDate: z.string(),
  ageInMonths: z.number().int().nonnegative(),
  ageLabel: z.string(),
  breed: z.string().nullable(),
  sex: BullSexSchema,
  arrivalDate: z.string(),
  initialWeight: z.number(),
  currentWeight: z.number(),
  photoUrl: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const BullDetailResponseSchema = BullResponseSchema.extend({
  weightRecords: z.array(WeightRecordResponseSchema),
});

const nullableNumberSchema = z.number().nullable();
const nullableStringSchema = z.string().nullable();

export const FeedResponseSchema = z.object({
  id: nullableStringSchema,
  type: FeedTypeSchema,
  currentStockKg: nullableNumberSchema,
  consumptionPerBullPerDayKg: nullableNumberSchema,
  bullsCount: z.number().int().nonnegative(),
  dailyConsumptionKg: nullableNumberSchema,
  daysLeft: nullableNumberSchema,
  periodStartDate: nullableStringSchema,
  depletionDate: nullableStringSchema,
  createdAt: nullableStringSchema,
  updatedAt: nullableStringSchema,
});

export const AuthUserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  emailVerifiedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const AuthSessionResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  user: AuthUserResponseSchema,
});

export const EmailVerificationDeliverySchema = z.enum(['email', 'dev_console']);

export const EmailVerificationRequiredResponseSchema = z.object({
  status: z.literal('verification_required'),
  email: z.string().email(),
  delivery: EmailVerificationDeliverySchema,
});

export const EmailVerificationResentResponseSchema = z.object({
  status: z.literal('verification_email_sent'),
  delivery: EmailVerificationDeliverySchema,
});

export type CreateBullInput = z.infer<typeof CreateBullInputSchema>;
export type UpdateBullInput = z.infer<typeof UpdateBullInputSchema>;
export type AddWeightInput = z.infer<typeof AddWeightInputSchema>;
export type ListBullsQuery = z.infer<typeof ListBullsQuerySchema>;
export type UpdateFeedInput = z.infer<typeof UpdateFeedInputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type ResendEmailVerificationInput = z.infer<typeof ResendEmailVerificationInputSchema>;
export type WeightRecordResponse = z.infer<typeof WeightRecordResponseSchema>;
export type BullResponse = z.infer<typeof BullResponseSchema>;
export type BullDetailResponse = z.infer<typeof BullDetailResponseSchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;
export type AuthUserResponse = z.infer<typeof AuthUserResponseSchema>;
export type AuthSessionResponse = z.infer<typeof AuthSessionResponseSchema>;
export type EmailVerificationDelivery = z.infer<typeof EmailVerificationDeliverySchema>;
export type EmailVerificationRequiredResponse = z.infer<
  typeof EmailVerificationRequiredResponseSchema
>;
export type EmailVerificationResentResponse = z.infer<typeof EmailVerificationResentResponseSchema>;
export type FeedAvailability = Pick<
  FeedResponse,
  'dailyConsumptionKg' | 'daysLeft' | 'periodStartDate' | 'depletionDate'
>;

export type CalculateFeedAvailabilityInput = {
  bullsCount: number;
  currentStockKg: number | null;
  consumptionPerBullPerDayKg: number | null;
};

const roundTo = (value: number, digits: number): number => Number(value.toFixed(digits));

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

export const calculateFeedDailyConsumptionKg = (
  bullsCount: number,
  consumptionPerBullPerDayKg: number | null,
): number | null => {
  if (bullsCount <= 0 || consumptionPerBullPerDayKg === null || consumptionPerBullPerDayKg <= 0) {
    return null;
  }

  return roundTo(bullsCount * consumptionPerBullPerDayKg, 2);
};

export const calculateFeedDaysLeft = (
  currentStockKg: number | null,
  dailyConsumptionKg: number | null,
): number | null => {
  if (currentStockKg === null || dailyConsumptionKg === null) {
    return null;
  }

  return roundTo(currentStockKg / dailyConsumptionKg, 2);
};

export const calculateFeedDepletionDate = (
  daysLeft: number | null,
  now = new Date(),
): string | null => {
  if (daysLeft === null) {
    return null;
  }

  const daysCovered = Math.max(Math.ceil(Math.max(daysLeft, 0)) - 1, 0);
  return toLocalDateString(addDays(startOfDay(now), daysCovered));
};

export const calculateFeedAvailability = (
  input: CalculateFeedAvailabilityInput,
  now = new Date(),
): FeedAvailability => {
  const dailyConsumptionKg = calculateFeedDailyConsumptionKg(
    input.bullsCount,
    input.consumptionPerBullPerDayKg,
  );
  const daysLeft = calculateFeedDaysLeft(input.currentStockKg, dailyConsumptionKg);
  const periodStartDate = daysLeft === null ? null : toLocalDateString(startOfDay(now));

  return {
    dailyConsumptionKg,
    daysLeft,
    periodStartDate,
    depletionDate: calculateFeedDepletionDate(daysLeft, now),
  };
};

export const calculateAgeInMonths = (birthDate: Date, now = new Date()): number => {
  let months = (now.getFullYear() - birthDate.getFullYear()) * 12;
  months += now.getMonth() - birthDate.getMonth();

  if (now.getDate() < birthDate.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
};

export const formatAgeRu = (ageInMonths: number): string => {
  const years = Math.floor(ageInMonths / 12);
  const months = ageInMonths % 12;

  if (years === 0) {
    return `${months} мес.`;
  }

  if (months === 0) {
    return `${years} г.`;
  }

  return `${years} г. ${months} мес.`;
};

export const toIsoDateString = (date: Date): string => date.toISOString().slice(0, 10);
