import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BullsController } from './bulls.controller';
import { BullsService } from './bulls.service';

@Module({
  imports: [AuthModule],
  controllers: [BullsController],
  providers: [BullsService],
})
export class BullsModule {}
