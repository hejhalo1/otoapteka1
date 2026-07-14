import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtUser } from '../auth.types';

// Gwarantuje, że manager ma przypisaną aptekę (claim zatwierdzony przez admina).
// Panel zawsze operuje na user.pharmacyId — nigdy na ID z żądania (IDOR-proof).
@Injectable()
export class RequirePharmacyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    if (!user?.pharmacyId) {
      throw new ForbiddenException(
        'Brak przypisanej apteki — poczekaj na zatwierdzenie zgłoszenia przez administratora.',
      );
    }
    return true;
  }
}
