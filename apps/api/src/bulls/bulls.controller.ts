import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AddWeightInputSchema,
  CreateBullInputSchema,
  ListBullsQuerySchema,
  UpdateBullInputSchema,
  type AddWeightInput,
  type BullDetailResponse,
  type BullResponse,
  type CreateBullInput,
  type ListBullsQuery,
  type UpdateBullInput,
  type WeightRecordResponse,
} from '@bulki-bull/shared';

import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { BullsService } from './bulls.service';

@Controller('bulls')
@UseGuards(AuthGuard)
export class BullsController {
  constructor(@Inject(BullsService) private readonly bullsService: BullsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(ListBullsQuerySchema)) query: ListBullsQuery,
  ): Promise<BullResponse[]> {
    return this.bullsService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BullDetailResponse> {
    return this.bullsService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateBullInputSchema)) body: CreateBullInput,
  ): Promise<BullDetailResponse> {
    return this.bullsService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateBullInputSchema)) body: UpdateBullInput,
  ): Promise<BullDetailResponse> {
    return this.bullsService.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.bullsService.remove(user.id, id);
  }

  @Get(':id/weights')
  findWeights(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<WeightRecordResponse[]> {
    return this.bullsService.findWeights(user.id, id);
  }

  @Post(':id/weights')
  addWeight(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddWeightInputSchema)) body: AddWeightInput,
  ): Promise<WeightRecordResponse> {
    return this.bullsService.addWeight(user.id, id, body);
  }
}
