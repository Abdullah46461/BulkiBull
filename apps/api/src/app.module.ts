import { Module } from '@nestjs/common';

import { BullsModule } from './bulls/bulls.module';
import { FeedsModule } from './feeds/feeds.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, BullsModule, FeedsModule],
  controllers: [HealthController],
})
export class AppModule {}
