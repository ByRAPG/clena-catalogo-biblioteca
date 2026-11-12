import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ACCESS_TOKEN_VERIFIER } from './application/ports/access-token-verifier';
import { CLOCK } from './application/ports/clock';
import { PASSWORD_HASHER } from './application/ports/password-hasher';
import { REFRESH_TOKEN_REPOSITORY } from './application/ports/refresh-token.repository';
import { TOKEN_SERVICE } from './application/ports/token-service';
import { USER_REPOSITORY } from './application/ports/user.repository';
import { LoginUser } from './application/login-user.use-case';
import { LogoutUser } from './application/logout-user.use-case';
import { RefreshSession } from './application/refresh-session.use-case';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaRefreshTokenRepository } from './infrastructure/prisma-refresh-token.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { SystemClock } from './infrastructure/system-clock';
import { AuthController } from './presentation/auth.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

@Module({
  // Los secretos y TTL se pasan en cada firma (ver JwtTokenService).
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    LoginUser,
    RefreshSession,
    LogoutUser,
    JwtAuthGuard,
    RolesGuard,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: CLOCK, useClass: SystemClock },
    JwtTokenService,
    // Una sola instancia cumple los dos puertos.
    { provide: TOKEN_SERVICE, useExisting: JwtTokenService },
    { provide: ACCESS_TOKEN_VERIFIER, useExisting: JwtTokenService },
  ],
  // Otros módulos importan IamModule para usar @UseGuards(JwtAuthGuard, RolesGuard).
  exports: [JwtAuthGuard, RolesGuard, ACCESS_TOKEN_VERIFIER],
})
export class IamModule {}
