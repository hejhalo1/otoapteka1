import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtUser, RefreshPayload } from './auth.types';
import type { Role } from '../generated/prisma/enums';

interface UserForToken {
  id: string;
  email: string;
  role: Role;
  pharmacyId: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtl: string;
  private readonly refreshTtl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.get<string>('JWT_ACCESS_SECRET') ?? '';
    this.refreshSecret = config.get<string>('JWT_REFRESH_SECRET') ?? '';
    this.accessTtl = config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    this.refreshTtl = config.get<string>('JWT_REFRESH_TTL') ?? '30d';
    if (!this.accessSecret || !this.refreshSecret) {
      throw new Error('Brak JWT_ACCESS_SECRET / JWT_REFRESH_SECRET w env');
    }
  }

  // "30d"/"15m"/"3600s" → ms (bez dekodowania JWT).
  private ttlToMs(ttl: string): number {
    const m = /^(\d+)\s*(s|m|h|d)?$/.exec(ttl.trim());
    if (!m) return 30 * 86_400_000;
    const n = Number(m[1]);
    const unit = m[2] ?? 's';
    const mult =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60_000
          : unit === 'h'
            ? 3_600_000
            : 86_400_000;
    return n * mult;
  }

  private async signAccess(user: UserForToken): Promise<string> {
    const payload: JwtUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
      pharmacyId: user.pharmacyId,
    };
    return this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtl as unknown as number,
    });
  }

  // Tworzy parę tokenów. `family` łączy rotowane refreshe (do wykrycia reuse).
  async issuePair(user: UserForToken, family?: string): Promise<TokenPair> {
    const jti = randomUUID();
    const fam = family ?? randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti, family: fam } satisfies RefreshPayload,
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtl as unknown as number,
      },
    );
    const refreshExpiresAt = new Date(
      Date.now() + this.ttlToMs(this.refreshTtl),
    );

    await this.prisma.refreshToken.create({
      data: {
        jti,
        userId: user.id,
        family: fam,
        tokenHash: await argon2.hash(refreshToken, { type: argon2.argon2id }),
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken: await this.signAccess(user),
      refreshToken,
      refreshExpiresAt,
    };
  }

  /**
   * Rotacja refresh-tokenu z wykryciem reuse:
   * - podpis niepoprawny → 401,
   * - jti nieznane lub już unieważnione → REUSE → unieważnij całą rodzinę → 401,
   * - poprawny → unieważnij bieżący, wystaw nową parę w tej samej rodzinie.
   */
  async rotate(rawRefresh: string): Promise<TokenPair> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(rawRefresh, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Nieprawidłowy token odświeżający');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // Reuse-detection: replay unieważnionego tokenu → wywal całą rodzinę.
      await this.prisma.refreshToken.updateMany({
        where: { family: payload.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Token odświeżający unieważniony');
    }

    const matches = await argon2.verify(stored.tokenHash, rawRefresh);
    if (!matches) {
      await this.prisma.refreshToken.updateMany({
        where: { family: payload.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Token odświeżający nie pasuje');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('Konto nieaktywne');

    // Unieważnij bieżący i wystaw nowy w tej samej rodzinie.
    await this.prisma.refreshToken.update({
      where: { jti: stored.jti },
      data: { revokedAt: new Date() },
    });
    return this.issuePair(user, stored.family);
  }

  async revoke(rawRefresh: string): Promise<void> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(rawRefresh, {
        secret: this.refreshSecret,
      });
      await this.prisma.refreshToken.updateMany({
        where: { jti: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      /* nieprawidłowy token — nic do unieważnienia */
    }
  }
}
