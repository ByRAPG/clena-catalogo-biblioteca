import { ArgumentsHost } from '@nestjs/common';
import {
  AccountLockedError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/iam-errors';
import { IamErrorsFilter } from './iam-errors.filter';

function run(error: Error) {
  const sent: {
    status?: number;
    body?: Record<string, unknown>;
    headers: Record<string, string>;
  } = { headers: {} };
  const response = {
    setHeader: (name: string, value: string) => {
      sent.headers[name] = value;
    },
    status: (code: number) => {
      sent.status = code;
      return response;
    },
    json: (body: Record<string, unknown>) => {
      sent.body = body;
    },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ originalUrl: '/api/v1/auth/login' }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  new IamErrorsFilter().catch(
    error as
      | InvalidCredentialsError
      | InvalidRefreshTokenError
      | AccountLockedError,
    host,
  );
  return sent;
}

describe('IamErrorsFilter', () => {
  it('cuenta bloqueada: 429 con Retry-After en segundos', () => {
    const sent = run(new AccountLockedError(900));
    expect(sent.status).toBe(429);
    expect(sent.headers['Retry-After']).toBe('900');
    expect(sent.body).toMatchObject({
      statusCode: 429,
      path: '/api/v1/auth/login',
    });
  });

  it('credenciales incorrectas: 401 con el mensaje genérico', () => {
    const sent = run(new InvalidCredentialsError());
    expect(sent.status).toBe(401);
    expect(sent.body).toMatchObject({
      message: 'Correo o contraseña incorrectos',
    });
    expect(sent.headers['Retry-After']).toBeUndefined();
  });

  it('refresh inválido: 401', () => {
    expect(run(new InvalidRefreshTokenError()).status).toBe(401);
  });
});
