import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { MailerService } from './mailer.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, MailerService],
  exports: [AuthGuard, AuthService],
})
export class AuthModule {}
