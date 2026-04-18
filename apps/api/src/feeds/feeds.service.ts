import { Inject, Injectable } from '@nestjs/common';
import { type FeedStock } from '@prisma/client';
import {
  feedTypeValues,
  type FeedResponse,
  type FeedType,
  type UpdateFeedInput,
} from '@bulki-bull/shared';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(): Promise<FeedResponse[]> {
    const [feedStocks, bullsCount] = await Promise.all([
      this.prisma.feedStock.findMany(),
      this.getBullsCount(),
    ]);

    const feedStockMap = new Map(feedStocks.map((feedStock) => [feedStock.type, feedStock]));

    return feedTypeValues.map((type) =>
      this.toFeedResponse(type, feedStockMap.get(type) ?? null, bullsCount),
    );
  }

  async update(type: FeedType, input: UpdateFeedInput): Promise<FeedResponse> {
    const feedStock = await this.prisma.feedStock.upsert({
      where: {
        type,
      },
      update: {
        currentStockKg: input.currentStockKg,
        consumptionPerBullPerDayKg: input.consumptionPerBullPerDayKg,
      },
      create: {
        type,
        currentStockKg: input.currentStockKg,
        consumptionPerBullPerDayKg: input.consumptionPerBullPerDayKg,
      },
    });

    const bullsCount = await this.getBullsCount();

    return this.toFeedResponse(type, feedStock, bullsCount);
  }

  private async getBullsCount(): Promise<number> {
    // TODO: switch to active bulls only when statuses appear in the data model.
    return this.prisma.bull.count();
  }

  private toFeedResponse(
    type: FeedType,
    feedStock: FeedStock | null,
    bullsCount: number,
  ): FeedResponse {
    const currentStockKg = feedStock?.currentStockKg.toNumber() ?? null;
    const consumptionPerBullPerDayKg = feedStock?.consumptionPerBullPerDayKg.toNumber() ?? null;
    const dailyConsumptionKg = this.calculateDailyConsumptionKg(
      bullsCount,
      consumptionPerBullPerDayKg,
    );
    const daysLeft =
      currentStockKg === null || dailyConsumptionKg === null
        ? null
        : this.roundTo(currentStockKg / dailyConsumptionKg, 2);

    return {
      id: feedStock?.id ?? null,
      type,
      currentStockKg,
      consumptionPerBullPerDayKg,
      bullsCount,
      dailyConsumptionKg,
      daysLeft,
      createdAt: feedStock?.createdAt.toISOString() ?? null,
      updatedAt: feedStock?.updatedAt.toISOString() ?? null,
    };
  }

  private calculateDailyConsumptionKg(
    bullsCount: number,
    consumptionPerBullPerDayKg: number | null,
  ): number | null {
    if (bullsCount <= 0 || consumptionPerBullPerDayKg === null || consumptionPerBullPerDayKg <= 0) {
      return null;
    }

    return this.roundTo(bullsCount * consumptionPerBullPerDayKg, 2);
  }

  private roundTo(value: number, digits: number): number {
    return Number(value.toFixed(digits));
  }
}
