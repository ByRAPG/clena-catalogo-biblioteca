import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

// La API solo devuelve JSON: ningún recurso necesita cargarse desde sus respuestas.
const apiHeaders = helmet({
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
  },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: { maxAge: 15552000, includeSubDomains: true },
});

// Swagger UI necesita scripts y estilos propios; solo se relaja en /docs.
const docsHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      frameAncestors: ["'none'"],
    },
  },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: { maxAge: 15552000, includeSubDomains: true },
});

export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const isDocs = req.path === '/docs' || req.path.startsWith('/docs/');
    (isDocs ? docsHeaders : apiHeaders)(req, res, next);
  };
}
