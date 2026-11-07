export type HealthStatus = 'ok' | 'degraded';
export type DatabaseStatus = 'up' | 'down';

export interface HealthReport {
  status: HealthStatus;
  database: DatabaseStatus;
  uptime: number;
  timestamp: string;
}
