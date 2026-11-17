import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { validateEnv } from '../../../shared/config/env.validation';
import { SharedModule } from '../../../shared/shared.module';
import { CreateInitialAdmin } from '../application/create-initial-admin.use-case';
import { PASSWORD_HASHER } from '../application/ports/password-hasher';
import { USER_REPOSITORY } from '../application/ports/user.repository';
import { Argon2PasswordHasher } from '../infrastructure/argon2-password-hasher';
import { PrismaUserRepository } from '../infrastructure/prisma-user.repository';
import { runCreateAdmin } from './create-admin.runner';

/** Módulo mínimo del comando: configuración validada, Prisma y lo justo de iam. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      validate: validateEnv,
    }),
    SharedModule,
  ],
  providers: [
    CreateInitialAdmin,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
  ],
})
export class CreateAdminCliModule {}

/**
 * Crea el primer administrador. Uso (sin argumentos; todo por entorno):
 *   ADMIN_EMAIL, ADMIN_PASSWORD (o ADMIN_PASSWORD_FILE: ruta de un archivo con la
 *   contraseña, p. ej. un secreto de Docker, para no exponerla en el entorno), ADMIN_FULL_NAME (opcional),
 *   ADMIN_ALLOW_ADDITIONAL=true (opcional).
 */
async function main(): Promise<number> {
  const env = { ...process.env };
  const file = env.ADMIN_PASSWORD_FILE?.trim();
  if (file) {
    try {
      env.ADMIN_PASSWORD = readFileSync(file, 'utf8').replace(/\r?\n$/, '');
    } catch {
      console.error('No se pudo leer ADMIN_PASSWORD_FILE.');
      return 2;
    }
  }
  let app;
  try {
    app = await NestFactory.createApplicationContext(CreateAdminCliModule, {
      logger: ['error'],
      abortOnError: false,
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'No se pudo iniciar el comando.',
    );
    return 1;
  }
  try {
    const { exitCode, message } = await runCreateAdmin(
      app.get(CreateInitialAdmin),
      env,
    );
    (exitCode === 0 ? console.log : console.error)(message);
    return exitCode;
  } finally {
    await app.close();
  }
}

void main().then((code) => {
  process.exitCode = code;
});
