import { SemanticModelStatus } from '../domain/health-report';
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

  describe('estado del modelo semántico', () => {
    const withModel = (current: SemanticModelStatus) =>
      new GetHealth(
        { isDatabaseAvailable: () => Promise.resolve(true) },
        { current: () => current },
      );

    it('informa off si no hay proveedor', async () => {
      const report = await build(() => Promise.resolve(true)).execute();
      expect(report.semanticModel).toBe('off');
    });

    it.each(['off', 'loading', 'ready', 'error'] as const)(
      'informa %s sin volver el servicio no saludable',
      async (state) => {
        const report = await withModel(state).execute();
        expect(report).toMatchObject({ status: 'ok', semanticModel: state });
      },
    );
  });
});
