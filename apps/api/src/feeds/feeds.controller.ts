import { Body, Controller, Get, Inject, Param, Put, UseGuards } from '@nestjs/common';
import {
  FeedTypeSchema,
  UpdateFeedInputSchema,
  type FeedResponse,
  type FeedType,
  type UpdateFeedInput,
} from '@bulki-bull/shared';

import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { FeedsService } from './feeds.service';

@Controller('feeds')
@UseGuards(AuthGuard)
export class FeedsController {
  constructor(@Inject(FeedsService) private readonly feedsService: FeedsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<FeedResponse[]> {
    return this.feedsService.findAll(user.id);
  }

  @Put(':type')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('type', new ZodValidationPipe(FeedTypeSchema)) type: FeedType,
    @Body(new ZodValidationPipe(UpdateFeedInputSchema)) body: UpdateFeedInput,
  ): Promise<FeedResponse> {
    return this.feedsService.update(user.id, type, body);
  }
}
