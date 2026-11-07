import { GetHealth } from './get-health.use-case';
import { HealthRepository } from './ports/health.repository';

describe('GetHealth', () => {
  const build = (
    isDatabaseAvailable: HealthRepository['isDatabaseAvailable'],
  ) => new GetHealth({ isDatabaseAvailable });

  it('devuelve ok cuando la base responde', async () => {
    const report = await build(() => Promise.resolve(true)).execute();
    expect(report.status).toBe('ok');
    expect(report.database).toBe('up');
    expect(new Date(report.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('devuelve degraded cuando la base no responde', async () => {
    const report = await build(() => Promise.resolve(false)).execute();
    expect(report).toMatchObject({ status: 'degraded', database: 'down' });
  });

  it('devuelve degraded sin lanzar si el repositorio falla', async () => {
    const report = await build(() =>
      Promise.reject(new Error('sin conexión')),
    ).execute();
    expect(report).toMatchObject({ status: 'degraded', database: 'down' });
  });
});
