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
    // 300 y no menos: los equipos de la biblioteca salen por una misma IP.
    THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(300),
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
      if (/change-?me/i.test(env[key])) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'no puede ser un valor de ejemplo (change-me) en producción',
        });
      }
    }
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message: 'debe ser distinto de JWT_ACCESS_SECRET en producción',
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
