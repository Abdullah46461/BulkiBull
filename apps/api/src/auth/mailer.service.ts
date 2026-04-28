import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { APP_NAME, type EmailVerificationDelivery } from '@bulki-bull/shared';
import nodemailer from 'nodemailer';

type SendVerificationEmailInput = {
  email: string;
  verificationUrl: string;
};

type SmtpProvider = 'gmail' | 'yandex' | 'mailru';

type SmtpConnectionConfig = {
  host: string;
  port: number;
  secure: boolean;
};

const smtpProviderConfigs: Record<SmtpProvider, SmtpConnectionConfig> = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
  },
  yandex: {
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
  },
  mailru: {
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
  },
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  getDeliveryMode(): EmailVerificationDelivery {
    return this.getSmtpConfig() ? 'email' : 'dev_console';
  }

  async sendEmailVerification(
    input: SendVerificationEmailInput,
  ): Promise<EmailVerificationDelivery> {
    const smtpConfig = this.getSmtpConfig();

    if (!smtpConfig) {
      this.logger.warn(
        `SMTP is not configured. Verification link for ${input.email}: ${input.verificationUrl}`,
      );
      return 'dev_console';
    }

    const transporter = nodemailer.createTransport({
      ...smtpConfig,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: input.email,
        subject: `Подтвердите почту в ${APP_NAME}`,
        text: [
          `Для входа в ${APP_NAME} подтвердите почту:`,
          '',
          input.verificationUrl,
          '',
          'Если вы не создавали аккаунт, просто проигнорируйте это письмо.',
        ].join('\n'),
        html: [
          `<p>Для входа в <strong>${APP_NAME}</strong> подтвердите почту:</p>`,
          `<p><a href="${input.verificationUrl}">Подтвердить почту</a></p>`,
          '<p>Если вы не создавали аккаунт, просто проигнорируйте это письмо.</p>',
        ].join(''),
      });
    } catch (error) {
      this.logger.error(`Could not send verification email to ${input.email}.`, error);
      throw new ServiceUnavailableException(
        'Не удалось отправить письмо подтверждения. Проверьте настройки SMTP и попробуйте еще раз.',
      );
    }

    return 'email';
  }

  private getSmtpConfig(): SmtpConnectionConfig | null {
    const providerConfig = this.getProviderConfig();
    const host = process.env.SMTP_HOST || providerConfig?.host;
    const port = Number(process.env.SMTP_PORT ?? providerConfig?.port ?? 587);
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : (providerConfig?.secure ?? false);

    if (!host || !process.env.EMAIL_FROM || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return null;
    }

    return {
      host,
      port,
      secure,
    };
  }

  private getProviderConfig(): SmtpConnectionConfig | null {
    const provider = process.env.SMTP_PROVIDER?.trim().toLowerCase();

    if (!provider) {
      return null;
    }

    if (provider === 'gmail' || provider === 'yandex' || provider === 'mailru') {
      return smtpProviderConfigs[provider];
    }

    this.logger.warn(`Unknown SMTP_PROVIDER "${process.env.SMTP_PROVIDER}".`);
    return null;
  }
}
