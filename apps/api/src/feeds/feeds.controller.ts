import { Body, Controller, Get, Inject, Param, Put } from '@nestjs/common';
import {
  FeedTypeSchema,
  UpdateFeedInputSchema,
  type FeedResponse,
  type FeedType,
  type UpdateFeedInput,
} from '@bulki-bull/shared';

import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { FeedsService } from './feeds.service';

@Controller('feeds')
export class FeedsController {
  constructor(@Inject(FeedsService) private readonly feedsService: FeedsService) {}

  @Get()
  findAll(): Promise<FeedResponse[]> {
    return this.feedsService.findAll();
  }

  @Put(':type')
  update(
    @Param('type', new ZodValidationPipe(FeedTypeSchema)) type: FeedType,
    @Body(new ZodValidationPipe(UpdateFeedInputSchema)) body: UpdateFeedInput,
  ): Promise<FeedResponse> {
    return this.feedsService.update(type, body);
  }
}
