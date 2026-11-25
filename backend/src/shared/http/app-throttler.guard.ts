import { ExecutionContext, Injectable } from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';
import type { Response } from 'express';

/**
 * Con varios límites con nombre, ThrottlerGuard solo emite `Retry-After-<nombre>`.
 * El frontend y el login ya leen `Retry-After`, así que se fija siempre esa cabecera.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('Retry-After', String(detail.timeToBlockExpire));
    throw new ThrottlerException();
  }
}
