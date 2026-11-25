import {
  CreateInitialAdmin,
  CreateInitialAdminResult,
} from '../application/create-initial-admin.use-case';
import {
  InvalidEmailError,
  InvalidFullNameError,
  WeakPasswordError,
} from '../domain/iam-errors';

export const DEFAULT_ADMIN_FULL_NAME = 'Administrador';

export interface RunnerOutput {
  exitCode: number;
  message: string;
}

type Env = Record<string, string | undefined>;

const MISSING = (name: string) =>
  `Falta la variable de entorno ${name}. Pásala con -e ${name}=... (nunca como argumento).`;

/**
 * Traduce el resultado del caso de uso a un código de salida y un mensaje.
 * Los mensajes nunca incluyen la contraseña ni el hash.
 */
export async function runCreateAdmin(
  useCase: Pick<CreateInitialAdmin, 'execute'>,
  env: Env,
): Promise<RunnerOutput> {
  const email = env.ADMIN_EMAIL?.trim();
  const password = env.ADMIN_PASSWORD;
  if (!email) return { exitCode: 2, message: MISSING('ADMIN_EMAIL') };
  if (!password) return { exitCode: 2, message: MISSING('ADMIN_PASSWORD') };
  const fullName = env.ADMIN_FULL_NAME?.trim() || DEFAULT_ADMIN_FULL_NAME;
  const allowAdditional = env.ADMIN_ALLOW_ADDITIONAL?.trim() === 'true';

  let result: CreateInitialAdminResult;
  try {
    result = await useCase.execute({
      email,
      password,
      fullName,
      allowAdditional,
    });
  } catch (error) {
    if (
      error instanceof InvalidEmailError ||
      error instanceof WeakPasswordError ||
      error instanceof InvalidFullNameError
    ) {
      return {
        exitCode: 2,
        message: `No se creó el administrador. ${error.message}.`,
      };
    }
    // Un error inesperado (p. ej. de la base de datos) puede traer datos de la
    // consulta: solo se informa su tipo.
    const kind = error instanceof Error ? error.name : 'desconocido';
    return {
      exitCode: 1,
      message: `No se pudo crear el administrador por un error inesperado (${kind}). Revisa la conexión con la base de datos.`,
    };
  }

  switch (result.status) {
    case 'created':
      return {
        exitCode: 0,
        message: `Administrador creado: ${email.toLowerCase()}. Ya puede iniciar sesión.`,
      };
    case 'already-exists':
      return {
        exitCode: 0,
        message: `Ya existía una cuenta con el correo ${email.toLowerCase()}. No se cambió nada (ni la contraseña ni el rol).`,
      };
    case 'admin-present':
      return {
        exitCode: 3,
        message:
          'No se creó nada: ya hay un administrador activo. Para crear otro a propósito, define ADMIN_ALLOW_ADDITIONAL=true.',
      };
  }
}
