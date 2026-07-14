import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Wymaga ważnego access-tokenu. Ustawia req.user (JwtUser).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
