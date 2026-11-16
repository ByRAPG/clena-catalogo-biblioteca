import { z } from 'zod';

const LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'verbose',
] as const;

const MIN_SECRET_LENGTH = 32;

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:5173')
      .refine(
        (value) => !value.split(',').some((origin) => origin.trim() === '*'),
        'no admite comodín (*): la API usa cookies con credenciales',
      ),
    // Saltos de proxy inverso de confianza: 'false' (por defecto) o un entero >= 1.
    TRUST_PROXY: z
      .string()
      .default('false')
      .refine(
        (value) => value === 'false' || /^[1-9]\d*$/.test(value),
        "debe ser 'false' o un entero positivo (número de proxies de confianza)",
      )
      .transform((value) => (value === 'false' ? false : Number(value))),
    // Límite global por IP: THROTTLE_LIMIT peticiones cada THROTTLE_TTL_SECONDS.
    THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
    // Límite más estricto para /auth/* (mismo intervalo).
    THROTTLE_AUTH_LIMIT: z.coerce.number().int().positive().default(20),
    PUBLIC_WEB_URL: z
      .url({ protocol: /^https?$/ })
      .default('http://localhost:5173'),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_REFRESH_TTL: z.string().default('7d'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      if (env[key].length < MIN_SECRET_LENGTH) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `debe tener al menos ${MIN_SECRET_LENGTH} caracteres en producción`,
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuración de entorno inválida: ${detail}`);
  }
  return result.data;
}
