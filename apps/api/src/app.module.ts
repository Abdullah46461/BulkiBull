import { Module } from '@nestjs/common';

import { BullsModule } from './bulls/bulls.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, BullsModule],
  controllers: [HealthController],
})
export class AppModule {}
