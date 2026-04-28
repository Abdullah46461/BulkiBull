import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.getBearerToken(request);

    request.user = await this.authService.authenticateToken(token);
    request.authToken = token;

    return true;
  }

  private getBearerToken(request: AuthenticatedRequest): string {
    const headerValue = request.headers.authorization;
    const authorization = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!authorization?.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Требуется вход в аккаунт.');
    }

    const token = authorization.slice(BEARER_PREFIX.length).trim();

    if (!token) {
      throw new UnauthorizedException('Требуется вход в аккаунт.');
    }

    return token;
  }
}
