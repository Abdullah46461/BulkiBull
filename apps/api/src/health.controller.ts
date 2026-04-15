import { Controller, Get, Inject } from '@nestjs/common';

import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: 'ok'; service: 'api'; database: 'ok' }> {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      service: 'api',
      database: 'ok',
    };
  }
}
