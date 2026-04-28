import { ConflictException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Prisma, type WeightRecord } from '@prisma/client';
import {
  calculateAgeInMonths,
  formatAgeRu,
  toIsoDateString,
  type AddWeightInput,
  type BullDetailResponse,
  type BullResponse,
  type CreateBullInput,
  type ListBullsQuery,
  type UpdateBullInput,
  type WeightRecordResponse,
} from '@bulki-bull/shared';

import { PrismaService } from '../prisma/prisma.service';

type BullWithWeightRecords = Prisma.BullGetPayload<{
  include: {
    weightRecords: true;
  };
}>;

@Injectable()
export class BullsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListBullsQuery): Promise<BullResponse[]> {
    const bulls = await this.prisma.bull.findMany({
      where: {
        userId,
        ...(query.search
          ? {
              tagNumber: {
                contains: query.search,
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      include: {
        weightRecords: {
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: 1,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return bulls.map((bull) => this.toBullResponse(bull));
  }

  async findOne(userId: string, id: string): Promise<BullDetailResponse> {
    const bull = await this.findBullWithWeightHistory(userId, id);

    return this.toBullDetailResponse(bull);
  }

  async create(userId: string, input: CreateBullInput): Promise<BullDetailResponse> {
    try {
      const bull = await this.prisma.bull.create({
        data: this.toCreateData(userId, input),
        include: {
          weightRecords: {
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          },
        },
      });

      return this.toBullDetailResponse(bull);
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async update(userId: string, id: string, input: UpdateBullInput): Promise<BullDetailResponse> {
    await this.ensureBullExists(userId, id);

    try {
      const bull = await this.prisma.bull.update({
        where: {
          id,
        },
        data: this.toUpdateData(input),
        include: {
          weightRecords: {
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          },
        },
      });

      return this.toBullDetailResponse(bull);
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.ensureBullExists(userId, id);

    try {
      await this.prisma.bull.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Bull not found.');
      }

      throw error;
    }
  }

  async findWeights(userId: string, id: string): Promise<WeightRecordResponse[]> {
    await this.ensureBullExists(userId, id);

    const weightRecords = await this.prisma.weightRecord.findMany({
      where: {
        bullId: id,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return weightRecords.map((weightRecord) => this.toWeightRecordResponse(weightRecord));
  }

  async addWeight(
    userId: string,
    id: string,
    input: AddWeightInput,
  ): Promise<WeightRecordResponse> {
    await this.ensureBullExists(userId, id);

    const weightRecord = await this.prisma.weightRecord.create({
      data: {
        bullId: id,
        date: this.toDate(input.date),
        weight: input.weight,
        comment: input.comment ?? null,
      },
    });

    return this.toWeightRecordResponse(weightRecord);
  }

  private async findBullWithWeightHistory(
    userId: string,
    id: string,
  ): Promise<BullWithWeightRecords> {
    const bull = await this.prisma.bull.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        weightRecords: {
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!bull) {
      throw new NotFoundException('Bull not found.');
    }

    return bull;
  }

  private async ensureBullExists(userId: string, id: string): Promise<void> {
    const bull = await this.prisma.bull.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!bull) {
      throw new NotFoundException('Bull not found.');
    }
  }

  private toCreateData(userId: string, input: CreateBullInput): Prisma.BullCreateInput {
    return {
      user: {
        connect: {
          id: userId,
        },
      },
      tagNumber: input.tagNumber,
      name: input.name ?? null,
      birthDate: this.toDate(input.birthDate),
      breed: input.breed ?? null,
      sex: input.sex,
      arrivalDate: this.toDate(input.arrivalDate),
      initialWeight: input.initialWeight,
      photoUrl: input.photoUrl ?? null,
      notes: input.notes ?? null,
    };
  }

  private toUpdateData(input: UpdateBullInput): Prisma.BullUpdateInput {
    const data: Prisma.BullUpdateInput = {};

    if (input.tagNumber !== undefined) {
      data.tagNumber = input.tagNumber;
    }

    if (input.name !== undefined) {
      data.name = input.name ?? null;
    }

    if (input.birthDate !== undefined) {
      data.birthDate = this.toDate(input.birthDate);
    }

    if (input.breed !== undefined) {
      data.breed = input.breed ?? null;
    }

    if (input.sex !== undefined) {
      data.sex = input.sex;
    }

    if (input.arrivalDate !== undefined) {
      data.arrivalDate = this.toDate(input.arrivalDate);
    }

    if (input.initialWeight !== undefined) {
      data.initialWeight = input.initialWeight;
    }

    if (input.photoUrl !== undefined) {
      data.photoUrl = input.photoUrl ?? null;
    }

    if (input.notes !== undefined) {
      data.notes = input.notes ?? null;
    }

    return data;
  }

  private toBullDetailResponse(bull: BullWithWeightRecords): BullDetailResponse {
    return {
      ...this.toBullResponse(bull),
      weightRecords: bull.weightRecords.map((weightRecord) =>
        this.toWeightRecordResponse(weightRecord),
      ),
    };
  }

  private toBullResponse(bull: BullWithWeightRecords): BullResponse {
    const ageInMonths = calculateAgeInMonths(bull.birthDate);
    const latestWeight = bull.weightRecords[0];

    return {
      id: bull.id,
      tagNumber: bull.tagNumber,
      name: bull.name,
      birthDate: toIsoDateString(bull.birthDate),
      ageInMonths,
      ageLabel: formatAgeRu(ageInMonths),
      breed: bull.breed,
      sex: bull.sex,
      arrivalDate: toIsoDateString(bull.arrivalDate),
      initialWeight: bull.initialWeight.toNumber(),
      currentWeight: latestWeight ? latestWeight.weight.toNumber() : bull.initialWeight.toNumber(),
      photoUrl: bull.photoUrl,
      notes: bull.notes,
      createdAt: bull.createdAt.toISOString(),
      updatedAt: bull.updatedAt.toISOString(),
    };
  }

  private toWeightRecordResponse(weightRecord: WeightRecord): WeightRecordResponse {
    return {
      id: weightRecord.id,
      bullId: weightRecord.bullId,
      date: toIsoDateString(weightRecord.date),
      weight: weightRecord.weight.toNumber(),
      comment: weightRecord.comment,
      createdAt: weightRecord.createdAt.toISOString(),
    };
  }

  private toDate(value: string): Date {
    return new Date(value);
  }

  private handlePrismaWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Bull tag number already exists.');
    }

    throw error;
  }
}
