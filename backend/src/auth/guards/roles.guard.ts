import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Role } from '../../generated/prisma/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtUser } from '../auth.types';

// Sprawdza rolę z JWT względem @Roles(...). Używać PO JwtAuthGuard.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('Brak uprawnień');
    }
    return true;
  }
}
