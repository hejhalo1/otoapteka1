import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Nadaje każdemu żądaniu request-id (nagłówek X-Request-Id + request.id dla filtra błędów)
// i loguje metodę, ścieżkę, status oraz czas. Świadomie logujemy request.path BEZ query
// stringa — w /api/pharmacies query zawiera lat/lng użytkownika (RODO: nie persystować,
// nie logować lokalizacji).
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { id?: string }>();
    const response = http.getResponse<Response>();

    const id = randomUUID();
    request.id = id;
    response.setHeader('X-Request-Id', id);

    const method = request.method;
    const path = request.path; // bez query — patrz komentarz wyżej
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(
          `[${id}] ${method} ${path} ${response.statusCode} +${ms}ms`,
        );
      }),
    );
  }
}
