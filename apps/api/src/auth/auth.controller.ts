import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  LoginInputSchema,
  RegisterInputSchema,
  ResendEmailVerificationInputSchema,
  type AuthSessionResponse,
  type AuthUserResponse,
  type EmailVerificationRequiredResponse,
  type EmailVerificationResentResponse,
  type LoginInput,
  type RegisterInput,
  type ResendEmailVerificationInput,
} from '@bulki-bull/shared';

import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentAuthToken, CurrentUser } from './current-user.decorator';

type HtmlResponse = {
  status(code: number): {
    type(contentType: string): {
      send(body: string): void;
    };
  };
};

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(RegisterInputSchema)) body: RegisterInput,
  ): Promise<EmailVerificationRequiredResponse> {
    return this.authService.register(body);
  }

  @Post('verify-email/resend')
  @HttpCode(HttpStatus.OK)
  resendEmailVerification(
    @Body(new ZodValidationPipe(ResendEmailVerificationInputSchema))
    body: ResendEmailVerificationInput,
  ): Promise<EmailVerificationResentResponse> {
    return this.authService.resendEmailVerification(body);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token = '', @Res() response: HtmlResponse): Promise<void> {
    try {
      const user = await this.authService.verifyEmail(token);

      response
        .status(HttpStatus.OK)
        .type('html')
        .send(
          this.renderVerificationPage({
            title: 'Почта подтверждена',
            description: `Адрес ${user.email} подтвержден. Теперь можно вернуться в Bulki Bull и войти.`,
            helperText: 'Если экран входа уже открыт, просто попробуйте войти еще раз.',
          }),
        );
    } catch (error) {
      const status =
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      const description =
        error instanceof HttpException
          ? this.getHttpExceptionMessage(error)
          : 'Не удалось подтвердить почту. Попробуйте запросить новое письмо и перейти по ссылке еще раз.';

      response
        .status(status)
        .type('html')
        .send(
          this.renderVerificationPage({
            title: 'Не удалось подтвердить почту',
            description,
            helperText: 'Вернитесь в приложение и запросите новое письмо подтверждения.',
            isError: true,
          }),
        );
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body(new ZodValidationPipe(LoginInputSchema)) body: LoginInput,
  ): Promise<AuthSessionResponse> {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUserResponse): AuthUserResponse {
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async logout(@CurrentAuthToken() token: string): Promise<void> {
    await this.authService.logout(token);
  }

  private getHttpExceptionMessage(error: HttpException): string {
    const response = error.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object') {
      const message = Reflect.get(response, 'message');

      if (Array.isArray(message)) {
        return message.join('\n');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return 'Не удалось обработать ссылку подтверждения.';
  }

  private renderVerificationPage(input: {
    title: string;
    description: string;
    helperText: string;
    isError?: boolean;
  }): string {
    const accentColor = input.isError ? '#8a321f' : '#1f5c3f';
    const backgroundColor = input.isError ? '#fff2ee' : '#e4efe7';
    const borderColor = input.isError ? '#e7b3a9' : '#cfe0d2';

    return [
      '<!doctype html>',
      '<html lang="ru">',
      '<head>',
      '<meta charset="utf-8">',
      `<title>${input.title}</title>`,
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '</head>',
      '<body style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:#f5f7f3;color:#1f2d24;">',
      '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;">',
      `<section style="width:min(100%,480px);border:1px solid ${borderColor};border-radius:12px;background:${backgroundColor};padding:24px;box-sizing:border-box;">`,
      `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;color:${accentColor};">${input.title}</h1>`,
      `<p style="margin:0 0 10px;font-size:16px;line-height:1.5;">${input.description}</p>`,
      `<p style="margin:0;color:#607067;font-size:14px;line-height:1.45;">${input.helperText}</p>`,
      '</section>',
      '</main>',
      '</body>',
      '</html>',
    ].join('');
  }
}
