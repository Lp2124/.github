import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

function safeMessage(status: number, exception: unknown, production: boolean): string {
  if (production && status >= 500) return 'Internal server error';
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && response !== null && 'message' in response) {
      const message = (response as { message?: unknown }).message;
      if (Array.isArray(message)) return message.join('; ');
      if (typeof message === 'string') return message;
    }
  }
  return status >= 500 ? 'Internal server error' : 'Request failed';
}

function errorCode(status: number): string {
  const names: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
  };
  return names[status] ?? 'REQUEST_FAILED';
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const production = process.env.NODE_ENV === 'production';

    if (status >= 500) {
      const message = exception instanceof Error ? exception.message : 'Unknown exception';
      this.logger.error(`Unhandled error on ${request.method} ${request.url}: ${message}`);
    }

    const body: ErrorBody = {
      success: false,
      error: {
        code: errorCode(status),
        message: safeMessage(status, exception, production),
      },
    };
    response.status(status).json(body);
  }
}
