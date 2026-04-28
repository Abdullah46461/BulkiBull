import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';
import type {
  AuthSessionResponse,
  AuthUserResponse,
  EmailVerificationDelivery,
  EmailVerificationRequiredResponse,
  EmailVerificationResentResponse,
  LoginInput,
  RegisterInput,
  ResendEmailVerificationInput,
} from '@bulki-bull/shared';

import { PrismaService } from '../prisma/prisma.service';
import {
  createEmailVerificationToken,
  createSessionToken,
  hashEmailVerificationToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from './auth.crypto';
import { MailerService } from './mailer.service';

const INVALID_CREDENTIALS_MESSAGE = 'Неверная почта или пароль.';
const DEFAULT_SESSION_TTL_DAYS = 30;
const DEFAULT_EMAIL_VERIFICATION_TTL_MINUTES = 24 * 60;

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MailerService) private readonly mailerService: MailerService,
  ) {}

  async register(input: RegisterInput): Promise<EmailVerificationRequiredResponse> {
    const passwordHash = await hashPassword(input.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
        },
      });

      const delivery = await this.sendEmailVerification(user);

      return {
        status: 'verification_required',
        email: user.email,
        delivery,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existingUser = await this.prisma.user.findUnique({
          where: {
            email: input.email,
          },
        });

        if (existingUser && !existingUser.emailVerifiedAt) {
          const delivery = await this.sendEmailVerification(existingUser);

          return {
            status: 'verification_required',
            email: existingUser.email,
            delivery,
          };
        }

        throw new ConflictException('Аккаунт с такой почтой уже существует.');
      }

      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthSessionResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Подтвердите почту перед входом в аккаунт.');
    }

    await this.removeExpiredSessions();

    return this.createSession(user);
  }

  async resendEmailVerification(
    input: ResendEmailVerificationInput,
  ): Promise<EmailVerificationResentResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!user || user.emailVerifiedAt) {
      return {
        status: 'verification_email_sent',
        delivery: this.mailerService.getDeliveryMode(),
      };
    }

    const delivery = await this.sendEmailVerification(user);

    return {
      status: 'verification_email_sent',
      delivery,
    };
  }

  async verifyEmail(token: string): Promise<AuthUserResponse> {
    if (!token.trim()) {
      throw new BadRequestException('Некорректная ссылка подтверждения.');
    }

    const now = new Date();
    const tokenHash = hashEmailVerificationToken(token);
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt <= now) {
      throw new BadRequestException('Ссылка подтверждения недействительна или устарела.');
    }

    const user = await this.prisma.$transaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: {
          id: verificationToken.userId,
        },
        data: {
          emailVerifiedAt: verificationToken.user.emailVerifiedAt ?? now,
        },
      });

      await transaction.emailVerificationToken.update({
        where: {
          id: verificationToken.id,
        },
        data: {
          usedAt: now,
        },
      });

      await transaction.emailVerificationToken.updateMany({
        where: {
          userId: verificationToken.userId,
          usedAt: null,
          id: {
            not: verificationToken.id,
          },
        },
        data: {
          usedAt: now,
        },
      });

      return updatedUser;
    });

    return this.toUserResponse(user);
  }

  async authenticateToken(token: string): Promise<AuthUserResponse> {
    const now = new Date();
    const session = await this.prisma.authSession.findUnique({
      where: {
        tokenHash: hashSessionToken(token),
      },
      include: {
        user: true,
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= now ||
      !session.user.emailVerifiedAt
    ) {
      throw new UnauthorizedException('Требуется вход в аккаунт.');
    }

    return this.toUserResponse(session.user);
  }

  async logout(token: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        tokenHash: hashSessionToken(token),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async createSession(user: User): Promise<AuthSessionResponse> {
    const expiresAt = new Date(Date.now() + this.getSessionTtlMs());

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const token = createSessionToken();

      try {
        await this.prisma.authSession.create({
          data: {
            userId: user.id,
            tokenHash: hashSessionToken(token),
            expiresAt,
          },
        });

        return {
          token,
          expiresAt: expiresAt.toISOString(),
          user: this.toUserResponse(user),
        };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Could not create an auth session.');
  }

  private async removeExpiredSessions(): Promise<void> {
    await this.prisma.authSession.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });
  }

  private async sendEmailVerification(user: User): Promise<EmailVerificationDelivery> {
    await this.removeExpiredEmailVerificationTokens();

    const token = createEmailVerificationToken();
    const expiresAt = new Date(Date.now() + this.getEmailVerificationTtlMs());

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashEmailVerificationToken(token),
        expiresAt,
      },
    });

    return this.mailerService.sendEmailVerification({
      email: user.email,
      verificationUrl: this.buildEmailVerificationUrl(token),
    });
  }

  private async removeExpiredEmailVerificationTokens(): Promise<void> {
    await this.prisma.emailVerificationToken.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });
  }

  private getSessionTtlMs(): number {
    const configuredDays = Number(process.env.AUTH_SESSION_TTL_DAYS);
    const days =
      Number.isFinite(configuredDays) && configuredDays > 0
        ? configuredDays
        : DEFAULT_SESSION_TTL_DAYS;

    return days * 24 * 60 * 60 * 1000;
  }

  private getEmailVerificationTtlMs(): number {
    const configuredMinutes = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES);
    const minutes =
      Number.isFinite(configuredMinutes) && configuredMinutes > 0
        ? configuredMinutes
        : DEFAULT_EMAIL_VERIFICATION_TTL_MINUTES;

    return minutes * 60 * 1000;
  }

  private buildEmailVerificationUrl(token: string): string {
    const baseUrl = process.env.API_PUBLIC_URL ?? 'http://localhost:3000';
    const url = new URL('/auth/verify-email', baseUrl);
    url.searchParams.set('token', token);

    return url.toString();
  }

  private toUserResponse(
    user: Pick<User, 'id' | 'email' | 'emailVerifiedAt' | 'createdAt'>,
  ): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
