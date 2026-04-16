import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

type ValidationIssue = {
  path: string;
  message: string;
};

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      throw new BadRequestException({
        message: 'Validation failed.',
        issues,
      });
    }

    return result.data;
  }
}
