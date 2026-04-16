import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
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
import { BullsService } from './bulls.service';

@Controller('bulls')
export class BullsController {
  constructor(@Inject(BullsService) private readonly bullsService: BullsService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(ListBullsQuerySchema)) query: ListBullsQuery,
  ): Promise<BullResponse[]> {
    return this.bullsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<BullDetailResponse> {
    return this.bullsService.findOne(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateBullInputSchema)) body: CreateBullInput,
  ): Promise<BullDetailResponse> {
    return this.bullsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateBullInputSchema)) body: UpdateBullInput,
  ): Promise<BullDetailResponse> {
    return this.bullsService.update(id, body);
  }

  @Get(':id/weights')
  findWeights(@Param('id') id: string): Promise<WeightRecordResponse[]> {
    return this.bullsService.findWeights(id);
  }

  @Post(':id/weights')
  addWeight(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddWeightInputSchema)) body: AddWeightInput,
  ): Promise<WeightRecordResponse> {
    return this.bullsService.addWeight(id, body);
  }
}
