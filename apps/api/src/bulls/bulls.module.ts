import { Module } from '@nestjs/common';

import { BullsController } from './bulls.controller';
import { BullsService } from './bulls.service';

@Module({
  controllers: [BullsController],
  providers: [BullsService],
})
export class BullsModule {}
