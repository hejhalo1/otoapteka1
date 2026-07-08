import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';

// Spójny format błędów dla całego API: { statusCode, message, error }.
// W odpowiedzi NIGDY nie ma stack trace (nawet w dev) — trafia tylko do logów serwera.
interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { id?: string }>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Wewnętrzny błąd serwera';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
        error = exception.name.replace(/Exception$/, '');
      } else if (typeof response === 'object' && response !== null) {
        const r = response as Record<string, unknown>;
        message = (r.message as string | string[]) ?? exception.message;
        error = (r.error as string) ?? exception.name.replace(/Exception$/, '');
      }
    }

    // Błędy serwerowe (5xx) logujemy ze stackiem — ale NIGDY nie logujemy query stringa,
    // bo w /api/pharmacies przychodzą współrzędne użytkownika (dane wrażliwe wg RODO).
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request?.id ?? '-'}] ${request?.method ?? ''} ${request?.path ?? ''} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = { statusCode, message, error };
    httpAdapter.reply(ctx.getResponse(), body, statusCode);
  }
}
