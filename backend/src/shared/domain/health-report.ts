export type HealthStatus = 'ok' | 'degraded';
export type DatabaseStatus = 'up' | 'down';
/** `off`: búsqueda semántica desactivada. Un modelo caído no degrada el servicio. */
export type SemanticModelStatus = 'off' | 'loading' | 'ready' | 'error';

export interface HealthReport {
  status: HealthStatus;
  database: DatabaseStatus;
  semanticModel: SemanticModelStatus;
  uptime: number;
  timestamp: string;
}
