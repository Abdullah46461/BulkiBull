import { Inject, Injectable } from '@nestjs/common';
import { type FeedStock } from '@prisma/client';
import {
  calculateFeedAvailability,
  calculateFeedDailyConsumptionKg,
  calculateFeedRemainingStockKg,
  feedTypeValues,
  type FeedResponse,
  type FeedType,
  type UpdateFeedInput,
} from '@bulki-bull/shared';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<FeedResponse[]> {
    const now = new Date();
    const [feedStocks, bullsCount] = await Promise.all([
      this.prisma.feedStock.findMany({
        where: {
          userId,
        },
      }),
      this.getBullsCount(userId),
    ]);

    const feedStockMap = new Map(feedStocks.map((feedStock) => [feedStock.type, feedStock]));

    return feedTypeValues.map((type) =>
      this.toFeedResponse(type, feedStockMap.get(type) ?? null, bullsCount, now),
    );
  }

  async update(userId: string, type: FeedType, input: UpdateFeedInput): Promise<FeedResponse> {
    const now = new Date();
    const feedStock = await this.prisma.feedStock.upsert({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      update: {
        currentStockKg: input.currentStockKg,
        consumptionPerBullPerDayKg: input.consumptionPerBullPerDayKg,
        stockSnapshotAt: now,
      },
      create: {
        userId,
        type,
        currentStockKg: input.currentStockKg,
        consumptionPerBullPerDayKg: input.consumptionPerBullPerDayKg,
        stockSnapshotAt: now,
      },
    });

    const bullsCount = await this.getBullsCount(userId);

    return this.toFeedResponse(type, feedStock, bullsCount, now);
  }

  private async getBullsCount(userId: string): Promise<number> {
    // TODO: switch to active bulls only when statuses appear in the data model.
    return this.prisma.bull.count({
      where: {
        userId,
      },
    });
  }

  private toFeedResponse(
    type: FeedType,
    feedStock: FeedStock | null,
    bullsCount: number,
    now: Date,
  ): FeedResponse {
    const storedCurrentStockKg = feedStock?.currentStockKg.toNumber() ?? null;
    const consumptionPerBullPerDayKg = feedStock?.consumptionPerBullPerDayKg.toNumber() ?? null;
    const dailyConsumptionKg = calculateFeedDailyConsumptionKg(
      bullsCount,
      consumptionPerBullPerDayKg,
    );
    const currentStockKg = calculateFeedRemainingStockKg(
      storedCurrentStockKg,
      dailyConsumptionKg,
      feedStock?.stockSnapshotAt,
      now,
    );
    const availability = calculateFeedAvailability(
      {
        bullsCount,
        currentStockKg: storedCurrentStockKg,
        consumptionPerBullPerDayKg,
        stockSnapshotAt: feedStock?.stockSnapshotAt,
      },
      now,
    );

    return {
      id: feedStock?.id ?? null,
      type,
      currentStockKg,
      consumptionPerBullPerDayKg,
      stockSnapshotAt: feedStock?.stockSnapshotAt.toISOString() ?? null,
      bullsCount,
      ...availability,
      createdAt: feedStock?.createdAt.toISOString() ?? null,
      updatedAt: feedStock?.updatedAt.toISOString() ?? null,
    };
  }
}
