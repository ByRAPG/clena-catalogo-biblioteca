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
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    PUBLIC_WEB_URL: z
      .url({ protocol: /^https?$/ })
      .default('http://localhost:5173'),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_REFRESH_TTL: z.string().default('7d'),
    SEMANTIC_SEARCH: z.enum(['on', 'off']).default('off'),
    EMBEDDING_PROVIDER: z.enum(['fake', 'local']).default('fake'),
    // Carpeta del modelo local (solo con EMBEDDING_PROVIDER=local); nunca se descarga en ejecución.
    EMBEDDING_MODEL_PATH: z.string().min(1).default('/app/models'),
    // Hilos de ONNX Runtime; sin fijarlos la consulta es ~18 veces más lenta en contenedores.
    EMBEDDING_INTRA_OP_THREADS: z.coerce
      .number()
      .int()
      .min(1)
      .max(64)
      .default(2),
    // Segundos entre reindexados de embeddings; 0 desactiva el intervalo.
    SEMANTIC_REINDEX_INTERVAL_SECONDS: z.coerce
      .number()
      .int()
      .min(0)
      .default(300),
    SEMANTIC_REINDEX_BATCH_SIZE: z.coerce
      .number()
      .int()
      .min(1)
      .max(500)
      .default(16),
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
