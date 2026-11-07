import { LogLevel } from '@nestjs/common';

const ORDER: LogLevel[] = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];

export function resolveLogLevels(level: string): LogLevel[] {
  const normalized = level === 'info' ? 'log' : level;
  const index = ORDER.indexOf(normalized as LogLevel);
  return ORDER.slice(0, index === -1 ? 4 : index + 1);
}
