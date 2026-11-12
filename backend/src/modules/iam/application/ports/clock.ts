export const CLOCK = Symbol('CLOCK');

/** Reloj inyectable: las pruebas controlan el tiempo sin esperar minutos reales. */
export interface Clock {
  now(): Date;
}
