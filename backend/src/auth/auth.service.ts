import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService, TokenPair } from './token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: dto.pharmacyId },
      select: { id: true },
    });
    if (!pharmacy)
      throw new BadRequestException('Wskazana apteka nie istnieje');

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    // Nie zdradzamy, czy e-mail istnieje (anty-enumeracja) — zwracamy tę samą treść.
    if (!existing) {
      const passwordHash = await argon2.hash(dto.password, {
        type: argon2.argon2id,
      });
      await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: 'PHARMACY_MANAGER',
          claims: {
            create: {
              pharmacyId: dto.pharmacyId,
              evidence: dto.evidence,
              status: 'PENDING',
            },
          },
        },
      });
    } else {
      this.logger.warn(
        `Rejestracja na istniejący e-mail (zignorowana): ${dto.email}`,
      );
    }

    return {
      message:
        'Zgłoszenie przyjęte. Po zatwierdzeniu przez administratora uzyskasz dostęp do panelu apteki.',
    };
  }

  async validateAndIssue(
    dto: LoginDto,
  ): Promise<{ tokens: TokenPair; user: PublicUser }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    // Generyczny komunikat — bez enumeracji e-maili.
    const invalid = new UnauthorizedException('Nieprawidłowy e-mail lub hasło');
    if (!user || !user.isActive) throw invalid;

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw invalid;

    const tokens = await this.tokens.issuePair(user);
    return { tokens, user: this.toPublic(user) };
  }

  async me(userId: string): Promise<PublicUser & { claim: ClaimInfo | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        claims: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { pharmacy: { select: { name: true, slug: true } } },
        },
      },
    });
    if (!user) throw new UnauthorizedException();
    const claim = user.claims[0];
    return {
      ...this.toPublic(user),
      claim: claim
        ? {
            status: claim.status,
            pharmacyName: claim.pharmacy.name,
            pharmacySlug: claim.pharmacy.slug,
            reviewNote: claim.reviewNote,
          }
        : null,
    };
  }

  private toPublic(user: {
    id: string;
    email: string;
    role: string;
    pharmacyId: string | null;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      pharmacyId: user.pharmacyId,
    };
  }
}

export interface PublicUser {
  id: string;
  email: string;
  role: string;
  pharmacyId: string | null;
}
export interface ClaimInfo {
  status: string;
  pharmacyName: string;
  pharmacySlug: string;
  reviewNote: string | null;
}
