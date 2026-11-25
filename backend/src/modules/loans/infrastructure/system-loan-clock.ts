import { Injectable } from '@nestjs/common';
import type { LoanClock } from '../application/ports/clock.port';

@Injectable()
export class SystemLoanClock implements LoanClock {
  now(): Date {
    return new Date();
  }
}
