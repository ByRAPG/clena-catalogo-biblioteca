import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { LoginUser } from '../application/login-user.use-case';
import { LogoutUser } from '../application/logout-user.use-case';
import { RefreshSession } from '../application/refresh-session.use-case';
import { SessionResult } from '../application/session';
import { InvalidRefreshTokenError } from '../domain/iam-errors';
import { AuthController } from './auth.controller';

const EXPIRES_AT = new Date('2026-11-19T15:00:00.000Z');

const session: SessionResult = {
  accessToken: 'access-jwt',
  refreshToken: 'refresh-jwt',
  refreshTokenExpiresAt: EXPIRES_AT,
  user: { name: 'Bibliotecaria de Demostración', role: 'STAFF' },
};

// Respuesta falsa que anota las cookies que se ponen o se borran.
function fakeResponse() {
  const cookies: { name: string; value: string; options: object }[] = [];
  const cleared: { name: string; options: object }[] = [];
  const res = {
    cookie: (name: string, value: string, options: object) =>
      cookies.push({ name, value, options }),
    clearCookie: (name: string, options: object) =>
      cleared.push({ name, options }),
  };
  return { res: res as unknown as Response, cookies, cleared };
}

const requestWith = (cookies?: Record<string, string>) =>
  ({ cookies }) as unknown as Request;

function setup(nodeEnv = 'development') {
  const calls: string[] = [];
  const loginUser = {
    execute: (input: { email: string; password: string }) => {
      calls.push(`login:${input.email}`);
      return Promise.resolve(session);
    },
  };
  let refreshResult: () => Promise<SessionResult> = () =>
    Promise.resolve(session);
  const refreshSession = {
    execute: (token: string) => {
      calls.push(`refresh:${token}`);
      return refreshResult();
    },
  };
  const logoutUser = {
    execute: (token: string | undefined) => {
      calls.push(`logout:${token}`);
      return Promise.resolve();
    },
  };
  const config = { get: () => nodeEnv } as unknown as ConfigService<
    never,
    true
  >;
  const controller = new AuthController(
    loginUser as unknown as LoginUser,
    refreshSession as unknown as RefreshSession,
    logoutUser as unknown as LogoutUser,
    config,
  );
  return {
    controller,
    calls,
    failRefreshWith: (error: Error) => {
      refreshResult = () => Promise.reject(error);
    },
  };
}

describe('AuthController', () => {
  it('login devuelve accessToken y usuario, y pone el refresh en cookie', async () => {
    const { controller } = setup();
    const { res, cookies } = fakeResponse();

    const body = await controller.login(
      { email: 'personal@example.org', password: 'x' },
      res,
    );

    expect(body).toEqual({
      accessToken: 'access-jwt',
      usuario: { nombre: 'Bibliotecaria de Demostración', rol: 'STAFF' },
    });
    expect(cookies).toEqual([
      {
        name: 'refresh_token',
        value: 'refresh-jwt',
        options: {
          httpOnly: true,
          sameSite: 'strict',
          secure: false,
          path: '/api/v1/auth',
          expires: EXPIRES_AT,
        },
      },
    ]);
  });

  it('la cookie es Secure solo en producción', async () => {
    const { controller } = setup('production');
    const { res, cookies } = fakeResponse();
    await controller.login({ email: 'a@b.co', password: 'x' }, res);
    expect(cookies[0].options).toMatchObject({ secure: true });
  });

  it('refresh usa la cookie y entrega un access nuevo', async () => {
    const { controller, calls } = setup();
    const { res, cookies } = fakeResponse();

    const body = await controller.refresh(
      requestWith({ refresh_token: 'cookie-token' }),
      res,
    );

    expect(calls).toEqual(['refresh:cookie-token']);
    expect(body.accessToken).toBe('access-jwt');
    expect(cookies).toHaveLength(1);
  });

  it('refresh inválido borra la cookie y propaga el error', async () => {
    const { controller, failRefreshWith } = setup();
    failRefreshWith(new InvalidRefreshTokenError());
    const { res, cleared } = fakeResponse();

    await expect(controller.refresh(requestWith(), res)).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
    expect(cleared).toHaveLength(1);
  });

  it('logout revoca el refresh de la cookie y la borra', async () => {
    const { controller, calls } = setup();
    const { res, cleared } = fakeResponse();

    await controller.logout(
      requestWith({ refresh_token: 'cookie-token' }),
      res,
    );

    expect(calls).toEqual(['logout:cookie-token']);
    expect(cleared).toEqual([
      {
        name: 'refresh_token',
        options: {
          httpOnly: true,
          sameSite: 'strict',
          secure: false,
          path: '/api/v1/auth',
        },
      },
    ]);
  });
});
