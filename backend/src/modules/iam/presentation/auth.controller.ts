import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { Env } from '../../../shared/config/env.validation';
import { DeleteMyAccount } from '../application/delete-my-account.use-case';
import { GetMyAccount } from '../application/get-my-account.use-case';
import { RegisterReader } from '../application/register-reader.use-case';
import { LoginUser } from '../application/login-user.use-case';
import { LogoutUser } from '../application/logout-user.use-case';
import { RefreshSession } from '../application/refresh-session.use-case';
import { SessionResult } from '../application/session';
import { InvalidRefreshTokenError } from '../domain/iam-errors';
import {
  AccountResponseDto,
  DeleteAccountDto,
  RegisterDto,
  RegisterResponseDto,
} from './dto/account.dto';
import { LoginDto } from './dto/login.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './guards/jwt-auth.guard';
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
    private readonly registerReader: RegisterReader,
    private readonly getMyAccount: GetMyAccount,
    private readonly deleteMyAccount: DeleteMyAccount,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Valida correo y contraseña. Devuelve el access token y el usuario, y deja el refresh token en una cookie httpOnly. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos; mientras dura, el login responde el mismo 401 que una contraseña incorrecta.',
  })
  @ApiOkResponse({ type: SessionResponseDto })
  @ApiBadRequestResponse({
    description: 'Correo o contraseña con formato inválido',
  })
  @ApiUnauthorizedResponse({ description: 'Correo o contraseña incorrectos' })
  @ApiTooManyRequestsResponse({
    description: 'Demasiadas peticiones desde la misma IP (límite por IP)',
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

  @Post('register')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Crear una cuenta de lector',
    description:
      'Registro público (HU-16). Exige acceptPrivacy=true y guarda la fecha y la versión del aviso aceptado. La respuesta es la misma exista o no el correo, para no revelar qué correos tienen cuenta; no abre sesión: después se ingresa con /auth/login.',
  })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, contraseña débil o aviso no aceptado',
  })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    await this.registerReader.execute(dto);
    return { registrado: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Datos de mi cuenta' })
  @ApiOkResponse({ type: AccountResponseDto })
  @ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
  async me(@Req() req: AuthenticatedRequest): Promise<AccountResponseDto> {
    const profile = await this.getMyAccount.execute(req.auth!.userId);
    return {
      nombre: profile.fullName,
      correo: profile.email,
      consentimientoEn: profile.consentAt?.toISOString() ?? null,
      versionAviso: profile.privacyVersion,
    };
  }

  @Post('me/delete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar mi cuenta',
    description:
      'Confirma con la contraseña y anonimiza la cuenta (HU-17). Con un préstamo activo responde 409. Revoca las sesiones y borra la cookie.',
  })
  @ApiNoContentResponse({ description: 'Cuenta eliminada' })
  @ApiForbiddenResponse({ description: 'Contraseña incorrecta' })
  @ApiConflictResponse({ description: 'Tiene un préstamo activo' })
  async deleteMe(
    @Body() dto: DeleteAccountDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.deleteMyAccount.execute({
      userId: req.auth!.userId,
      password: dto.password,
    });
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
