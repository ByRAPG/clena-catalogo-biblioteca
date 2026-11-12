import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { Env } from '../../../shared/config/env.validation';
import { LoginUser } from '../application/login-user.use-case';
import { LogoutUser } from '../application/logout-user.use-case';
import { RefreshSession } from '../application/refresh-session.use-case';
import { SessionResult } from '../application/session';
import { InvalidRefreshTokenError } from '../domain/iam-errors';
import { LoginDto } from './dto/login.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { IamErrorsFilter } from './iam-errors.filter';

const REFRESH_COOKIE = 'refresh_token';
// La cookie solo viaja a las rutas de autenticación, no a toda la API.
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function toSessionResponse(session: SessionResult): SessionResponseDto {
  return {
    accessToken: session.accessToken,
    usuario: { nombre: session.user.name, rol: session.user.role },
  };
}

@ApiTags('auth')
@Controller('auth')
@UseFilters(IamErrorsFilter)
export class AuthController {
  constructor(
    private readonly loginUser: LoginUser,
    private readonly refreshSession: RefreshSession,
    private readonly logoutUser: LogoutUser,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Valida correo y contraseña. Devuelve el access token y el usuario, y deja el refresh token en una cookie httpOnly. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.',
  })
  @ApiOkResponse({ type: SessionResponseDto })
  @ApiBadRequestResponse({
    description: 'Correo o contraseña con formato inválido',
  })
  @ApiUnauthorizedResponse({ description: 'Correo o contraseña incorrectos' })
  @ApiTooManyRequestsResponse({
    description: 'Cuenta bloqueada por demasiados intentos fallidos',
    headers: {
      'Retry-After': {
        description: 'Segundos que faltan para poder intentarlo de nuevo',
        schema: { type: 'integer' },
      },
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponseDto> {
    const session = await this.loginUser.execute({
      email: dto.email,
      password: dto.password,
    });
    this.setRefreshCookie(res, session);
    return toSessionResponse(session);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Renovar la sesión',
    description:
      'Lee el refresh token de la cookie, lo rota (el anterior queda revocado) y devuelve un access token nuevo. Si se reutiliza un token ya revocado, se cierran todas las sesiones de esa familia.',
  })
  @ApiOkResponse({ type: SessionResponseDto })
  @ApiUnauthorizedResponse({
    description: 'La cookie falta, expiró o ya no es válida',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponseDto> {
    try {
      const session = await this.refreshSession.execute(
        this.readRefreshCookie(req),
      );
      this.setRefreshCookie(res, session);
      return toSessionResponse(session);
    } catch (error) {
      // Si el token ya no sirve, la cookie tampoco: se borra para no reenviarla.
      if (error instanceof InvalidRefreshTokenError) {
        this.clearRefreshCookie(res);
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'Revoca el refresh token de la cookie y la borra. Responde 204 aunque no haya sesión.',
  })
  @ApiNoContentResponse({ description: 'Sesión cerrada' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.logoutUser.execute(this.readRefreshCookie(req));
    this.clearRefreshCookie(res);
  }

  /** Sin cookie devuelve '', que los casos de uso rechazan como token inválido. */
  private readRefreshCookie(req: Request): string {
    const { cookies } = req as Request & {
      cookies?: Record<string, string | undefined>;
    };
    return cookies?.[REFRESH_COOKIE] ?? '';
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'strict',
      // Secure solo en producción: en local se usa http://localhost.
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      path: REFRESH_COOKIE_PATH,
    };
  }

  private setRefreshCookie(res: Response, session: SessionResult): void {
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
      ...this.cookieOptions(),
      expires: session.refreshTokenExpiresAt,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }
}
