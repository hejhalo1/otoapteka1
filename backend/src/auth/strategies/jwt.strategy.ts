import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtUser } from '../auth.types';

// Waliduje access-token z nagłówka Authorization: Bearer <token>.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('Brak JWT_ACCESS_SECRET w env');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtUser): JwtUser {
    if (!payload?.sub) throw new UnauthorizedException();
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      pharmacyId: payload.pharmacyId ?? null,
    };
  }
}
