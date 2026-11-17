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
    // Búsqueda semántica en consulta: tiempo máximo (ms), inferencias
    // simultáneas y caché de embeddings de consulta.
    SEMANTIC_TIMEOUT_MS: z.coerce.number().int().min(1).default(800),
    SEMANTIC_MAX_CONCURRENCY: z.coerce.number().int().min(1).default(2),
    SEMANTIC_CACHE_SIZE: z.coerce.number().int().min(0).default(500),
    SEMANTIC_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(600),
    // Calidad de la semántica (calibrados para multilingual-e5-small): similitud
    // coseno mínima, distancia máxima al mejor resultado y peso de la léxica.
    SEARCH_MIN_SIMILARITY: z.coerce.number().min(0).max(1).default(0.84),
    SEARCH_RELATIVE_CUTOFF: z.coerce.number().min(0).max(1).default(0.04),
    SEARCH_LEXICAL_WEIGHT: z.coerce.number().min(0).max(10).default(2),
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
  })
  .superRefine((env, ctx) => {
    if (env.SEMANTIC_SEARCH === 'on' && env.EMBEDDING_PROVIDER === 'local') {
      ctx.addIssue({
        code: 'custom',
        path: ['EMBEDDING_PROVIDER'],
        message:
          'local aún no está implementado; usa fake o SEMANTIC_SEARCH=off',
      });
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
