# Informe de seguridad del sistema

Este informe documenta cómo está protegido el Catálogo bibliográfico accesible de la Biblioteca del CLENA, qué se encontró en la auditoría del 20 de noviembre de 2026 y qué queda pendiente. Cada afirmación remite al archivo y la línea donde se puede comprobar, y al PR donde vive el control.

## 1. Alcance y metodología

**Fecha de la auditoría:** 20 de noviembre de 2026.

**Código analizado:** la integración de los 15 PR abiertos del Sprint 2 sobre `main` (carpeta de integración local, en la que se verificó cada referencia `ruta:línea`). Los controles que se corrigieron el mismo día viven en la rama de su PR y se citan con ese PR. Los números de línea corresponden a la integración local; pueden desplazarse unas líneas tras el squash merge.

**Componentes dentro del alcance:** API NestJS (`backend/`), SPA React (`frontend/`), imágenes y composición Docker (`docker-compose*.yml`, `Dockerfile`, `Caddyfile`), automatización de CI (`.github/`).

**Fuera del alcance:** infraestructura del proveedor donde se despliegue, pruebas de penetración contra el despliegue en vivo y el ajuste de los secretos reales de producción (no existen en el repositorio).

**Metodología:**

- Revisión manual del código fuente de autenticación, autorización, validación, cabeceras, configuración y contenedores.
- Referencias: OWASP Top 10 (ediciones 2021 y 2025 coinciden en las categorías usadas aquí; se usa la numeración A01 a A10 de 2021) y OWASP ASVS 4.0 nivel 1.
- Escáneres automáticos: CodeQL (análisis estático, en CI), gitleaks (secretos en el historial), Trivy (dependencias, configuración e imágenes) y `pnpm audit` (dependencias de producción).
- No se ejecutó ninguna prueba contra servicios en vivo. Los datos usados son ficticios.

## 2. Modelo de amenazas

| Actor | Capacidad | Qué busca |
|---|---|---|
| Lector anónimo | Usa la búsqueda y el detalle públicos, sin cuenta | Abusar de la búsqueda (consumo de recursos), leer datos no públicos |
| Personal (STAFF) | Registra y edita obras y salas | Escalar privilegios a administrador |
| Administrador (ADMIN) | Importa el catálogo y gestiona cuentas | Su cuenta es el objetivo de mayor valor |
| Atacante externo | Solo red; sin cuenta | Adivinar contraseñas, tomar una sesión, inyectar código, agotar recursos |

**Activos:** cuentas y credenciales (hash de contraseña, secretos JWT), sesión (access token en memoria y refresh token en cookie), catálogo bibliográfico (integridad y disponibilidad) y el servicio mismo.

Los datos personales son mínimos: solo correo y rol del personal. El producto no usa IA externa; la búsqueda semántica corre en el propio servidor.

### Resumen STRIDE

| Amenaza | Escenario | Mitigación principal |
|---|---|---|
| Suplantación (S) | Robo o adivinación de credenciales | Argon2id, bloqueo por cuenta, límite por IP, tokens firmados |
| Manipulación (T) | Modificar el catálogo sin permiso | `JwtAuthGuard` y `RolesGuard` en cada ruta de escritura, validación con lista blanca |
| Repudio (R) | Negar una acción de escritura | Registro de la API con nivel configurable; la auditoría detallada queda como mejora |
| Divulgación (I) | Filtrar datos o su existencia | Mensaje único en el login, cabeceras de seguridad, sin `Server` ni `X-Powered-By` |
| Denegación de servicio (D) | Inundar la API o la búsqueda | Límite por IP, tope de cuerpo, tiempo y concurrencia de la búsqueda semántica |
| Elevación (E) | Pasar de lector a administrador | Roles en el token y comprobación en el servidor, importación solo `ADMIN` |

No se incluye diagrama de flujo de datos: la arquitectura ya está en `docs/arquitectura.md` y este informe no añade componentes nuevos.

## 3. Controles implementados

### 3.1 Por categoría OWASP

| Categoría | Control | Evidencia | PR |
|---|---|---|---|
| A01 Control de acceso | `JwtAuthGuard` exige `Authorization: Bearer` y `RolesGuard` aplica el rol; escritura de obras y salas solo `STAFF` y `ADMIN`, importación solo `ADMIN` | `backend/src/modules/iam/presentation/guards/jwt-auth.guard.ts:30-37`; `catalog-works.controller.ts:39-40`; `rooms.controller.ts:61-62`; `import-catalog.controller.ts:55-56` | Base y #83 |
| A01 Control de acceso | Primer administrador creado por línea de comandos, sin ruta HTTP pública de registro | `backend/src/modules/iam/presentation/create-admin.cli.ts`, `create-initial-admin.use-case.ts` | #120 |
| A02 Fallos criptográficos | Contraseñas con Argon2id; refresh token guardado solo como hash; secretos JWT distintos, de al menos 32 caracteres y sin valores de ejemplo en producción | `argon2-password-hasher.ts:5-7`; `env.validation.ts:88-97` (integración) y `env.validation.ts:55-76` (rechazo de `change-me` e igualdad) | Base y #109 |
| A02 Fallos criptográficos | TLS automático con Caddy y HSTS de un año | `frontend/Caddyfile:4,20` | #118 |
| A03 Inyección | `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`; consultas SQL crudas solo con plantilla etiquetada de Prisma (valores parametrizados); sin `innerHTML` ni `dangerouslySetInnerHTML` en la SPA | `app.setup.ts:20-26`; `prisma-search.repository.ts:63-71`; búsqueda sin coincidencias en `frontend/src` | Base |
| A04 Diseño inseguro | Bloqueo de cuenta tras 5 fallos durante 15 minutos; límite global por IP y límite estricto en rutas de autenticación; tiempo y concurrencia máximos de la búsqueda semántica | `user.entity.ts:70-78`; `throttler.config.ts:21-31`; `env.validation.ts:74-79` | Base, #109, #113 |
| A05 Configuración incorrecta | Helmet con CSP de la API en `default-src 'none'`; CSP de la SPA sin `unsafe-inline` en scripts; `Server` y `X-Powered-By` eliminados; CORS con lista de orígenes; `trust proxy` solo si `TRUST_PROXY` lo indica | `security-headers.ts:5-26`; `Caddyfile:16-25,54`; `main.ts:15-30` | #109, #118 |
| A05 Configuración incorrecta | Contenedores de producción sin root, con sistema de archivos de solo lectura, sin capacidades y con límites de memoria; solo `web` publica puertos | `backend/Dockerfile:61`; `frontend/Dockerfile:37`; `docker-compose.prod.yml:29-30,57-65` | #114, #118 |
| A05 Configuración incorrecta | Puertos de desarrollo ligados a `127.0.0.1` | `docker-compose.yml:10,31,59,69-70` (rama `wt-pgvector`) | #108 |
| A06 Componentes vulnerables | Dependabot semanal para npm, GitHub Actions y Docker; `pnpm audit`, Trivy y CodeQL en CI | `.github/dependabot.yml`; `codeql.yml`; `seguridad.yml:55-108` | #109, #121 |
| A07 Fallos de autenticación | Mensaje único para correo inexistente, cuenta inactiva y contraseña mala; refresh token en cookie `httpOnly`, `sameSite=strict` y `secure` en producción; rotación con detección de reutilización que cierra la familia | `login-user.use-case.ts:39-59`; `auth.controller.ts:141-146`; `refresh-session.use-case.ts:35-52` | Base (ADR-03) |
| A08 Integridad de software y datos | Acciones de GitHub fijadas a SHA; binarios de gitleaks y Trivy con versión y SHA-256 verificados; modelo de embeddings con revisión fija | `ci.yml:24,56-57` (rama `wt-pgvector`); `seguridad.yml:25-31,49-52` | #108, #121, #113 |
| A09 Registro y monitoreo | Nivel de registro configurable; filtro global de excepciones que no expone trazas; sonda de salud | `app.setup.ts:27`; `main.ts:20`; `all-exceptions.filter.ts:40` | Base |
| A10 Falsificación de peticiones del servidor (SSRF) | La API no hace peticiones salientes por entrada del usuario; el enlace digital de una obra solo se acepta con `http` o `https` | `frontend/src/shared/texto/url-web.ts:1-6` (rama `wt-cabecera`) | #115 |

### 3.2 Lista ASVS nivel 1 (resumen)

| Capítulo ASVS | Estado | Evidencia |
|---|---|---|
| V2 Autenticación | Cumple, con las excepciones H-03 a H-05 | Argon2id, bloqueo, mensaje único |
| V3 Gestión de sesión | Cumple con el riesgo residual R-01 | Cookie `httpOnly`/`strict`, rotación, cierre de familia |
| V4 Control de acceso | Cumple | Guards por rol en cada ruta de escritura |
| V5 Validación | Cumple, con la excepción H-06 | `ValidationPipe`, parámetros SQL, tope JSON de 2 MB |
| V7 Errores y registro | Cumple parcialmente | Filtro de excepciones; sin registro de auditoría de negocio |
| V8 Protección de datos | Cumple | Datos mínimos, sin secretos en el repositorio (gitleaks) |
| V9 Comunicaciones | Cumple en producción | TLS y HSTS en Caddy |
| V12 Archivos | Cumple | Importación CSV solo para `ADMIN`, enviada como JSON limitado |
| V14 Configuración | Cumple | Cabeceras, imágenes mínimas, dependencias vigiladas |

### 3.3 Riesgos del componente de embeddings

| Riesgo | Mitigación |
|---|---|
| Datos importados que alteran el índice | Solo `ADMIN` importa; el texto se valida y se indexa por script, no se ejecuta |
| Consumo de recursos de la búsqueda | `SEMANTIC_TIMEOUT_MS`, `SEMANTIC_MAX_CONCURRENCY` y caché acotada (`env.validation.ts:74-79`); si falla, cae a la búsqueda léxica |
| Integridad del modelo | Revisión fija del modelo, descarga solo en la construcción y límite de memoria del contenedor (PR #113) |

## 4. Hallazgos de la auditoría del 20 de noviembre

Severidad: **Alta** (explotable con impacto serio sin condiciones especiales), **Media** (explotable con condiciones o impacto limitado), **Baja** (endurecimiento o riesgo teórico).

### 4.1 Arreglados el 20 de noviembre

| Id | Hallazgo | Severidad | Corrección | PR |
|---|---|---|---|---|
| H-01 | Puertos de desarrollo (base, API, Vite, correo) publicados en todas las interfaces; acciones de CI referenciadas por etiqueta móvil | Media | Puertos ligados a `127.0.0.1` (`docker-compose.yml:10,31,59,69-70`); acciones fijadas a SHA (`ci.yml:24,56-57`) | #108 |
| H-02 | En producción se aceptaban secretos JWT de ejemplo o iguales entre sí; sin Dependabot para Docker | Alta | Rechazo de `change-me` y de igualdad entre secretos (`env.validation.ts:55-76`); ecosistema `docker` en `dependabot.yml:25,32` | #109 |
| H-07 | Enlace digital de una obra aceptaba cualquier esquema, incluido `javascript:` | Media | Solo `http:` y `https:` (`url-web.ts:1-6`) | #115 |
| H-08 | Caddy no limitaba el cuerpo; solo la API cortaba a 2 MB | Baja | `request_body { max_size 2MB }` para `/api` (`frontend/Caddyfile:31-33`, rama `wt-prod`) | #118 |
| H-09 | `ADMIN_PASSWORD` seguía en el entorno del proceso tras crear el administrador | Baja | Se elimina del entorno y se admite `ADMIN_PASSWORD_FILE` (`create-admin.cli.ts:42-54`, rama `wt-admin`) | #120 |

### 4.2 Abiertos y asignados

| Id | Hallazgo | Severidad | Recomendación | Responsable |
|---|---|---|---|---|
| H-03 | El contador de intentos fallidos no es atómico: dos peticiones simultáneas pueden leer el mismo valor y contar un solo fallo (`login-user.use-case.ts:52-53`, `user.entity.ts:70-78`) | Media | Incremento atómico en SQL (`UPDATE ... SET failed = failed + 1 ... RETURNING`) dentro de una transacción | T-27, Juan Camilo |
| H-04 | Un tercero puede bloquear la cuenta ajena con cinco intentos, y la respuesta 429 de «cuenta bloqueada» (`login-user.use-case.ts:43-44,55-56`) revela que el correo existe | Media | Mantener la respuesta 401 genérica durante el bloqueo, o bloquear por pareja correo más IP; avisar al titular por otro canal | T-27, Juan Camilo |
| H-05 | Enumeración de correos por tiempo: con correo inexistente no se calcula ningún hash y la respuesta es más rápida (`login-user.use-case.ts:40`) | Baja | Verificar contra un hash ficticio precalculado cuando el usuario no existe | T-27, Juan Camilo |
| H-06 | La importación CSV no tiene tope de filas ni de longitud por campo; solo el límite global de 2 MB | Media | Máximo de filas (por ejemplo 5 000) y de caracteres por campo en el DTO de importación | T-35 y T-36, Humberto |

### 4.3 Riesgos aceptados o residuales

| Id | Riesgo | Severidad | Decisión y recomendación |
|---|---|---|---|
| R-01 | El access token sigue válido hasta 15 minutos tras cerrar sesión o desactivar la cuenta, porque `JwtAuthGuard` solo verifica la firma (`jwt-auth.guard.ts:30-37`) | Baja | Aceptado (ADR-03): vida corta de 15 minutos. Si se exige, comprobar el estado del usuario en cada petición |
| R-02 | Password spraying distribuido: el límite es por IP y el bloqueo por cuenta, de modo que muchas IP con pocas pruebas cada una pasan | Baja | Aceptado: Argon2id encarece cada intento y las contraseñas del personal son pocas. Recomendar contraseñas largas y, a futuro, doble factor para `ADMIN` |
| R-03 | `pnpm audit` del backend: 2 altas transitivas de `prisma > @prisma/config` (`deepmerge-ts` 7.1.5, `effect` 3.21.0, ReDoS) | Baja | Aceptado: solo las usa la CLI de Prisma en migraciones, no la ruta de una petición. Se resolverá al actualizar Prisma (Dependabot) |
| R-04 | El tope JSON de 2 MB es global, no por ruta (`app.setup.ts:11,16`) | Baja | Aceptado: Caddy ya corta a 2 MB. Si se amplía, reducir el tope en las rutas que no importan |
| R-05 | La CSP estricta está solo en la SPA; la API usa `default-src 'none'` y `/docs` relaja a `unsafe-inline` para Swagger | Baja | Aceptado: `/docs` no contiene datos. Considerar desactivar `/docs` en producción |
| R-06 | Los secretos viajan en variables de entorno, no en Docker secrets | Baja | Aceptado para una sola máquina. El archivo `.env.prod` no se versiona (`.gitignore`) y se restringe con permisos `600` |
| R-07 | HSTS sin `preload` (`Caddyfile:20`) | Baja | Aceptado: la precarga es difícil de revertir. Revisar cuando el dominio definitivo esté estable |

## 5. Resultados de los escáneres

Los escáneres se ejecutaron el 20 de noviembre de 2026 sobre el código de integración, con las mismas versiones que fija `seguridad.yml` (gitleaks 8.30.1 y Trivy 0.76.2), mediante sus imágenes oficiales de Docker.

| Herramienta | Alcance | Resultado |
|---|---|---|
| `pnpm audit --prod` (backend) | Dependencias de producción | 2 vulnerabilidades altas, 0 críticas: `deepmerge-ts` (GHSA-ggr8-5vv4-36mx) y `effect` (GHSA-7589-6fvf-x4pw), ambas por `prisma > @prisma/config` (R-03) |
| `pnpm audit --prod` (frontend) | Dependencias de producción | Sin vulnerabilidades conocidas |
| gitleaks 8.30.1 | Historial completo de git (168 commits), con `--redact` | Sin fugas |
| Trivy 0.76.2, `fs` | Lockfiles de `backend/`, `frontend/` y `docs/pdf/`, severidad HIGH y CRITICAL | Backend: 2 altas (las mismas de R-03, con corrección en `deepmerge-ts` 8.0.0 y `effect` 3.22.1); frontend: 0; `docs/pdf`: 0; críticas: 0 |
| Trivy 0.76.2, `config` | `backend/Dockerfile` y `frontend/Dockerfile`, severidad HIGH y CRITICAL | 0 hallazgos |
| CodeQL | JavaScript y TypeScript | Lo ejecuta GitHub Actions en cada PR y cada lunes (`codeql.yml`); no se corrió de forma local. Consultar la pestaña Seguridad del repositorio |
| Trivy sobre imágenes | Imágenes de producción de backend y frontend | No se ejecutó de forma local; corre en CI (`seguridad.yml`, trabajo `trivy-imagenes`) |
| Calificación de cabeceras | Cabeceras HTTP del despliegue | No se midió: depende de una URL pública que aún no existe. Pendiente (sección 6) |

## 6. Conclusiones y próximos pasos

**Conclusiones**

- El sistema cubre las categorías OWASP Top 10 relevantes para una aplicación de catálogo sin pagos ni datos personales sensibles. Los controles esenciales (autorización por rol, Argon2id, cookie de sesión endurecida, cabeceras, contenedores sin privilegios, escáneres en CI) están implementados y respaldados por pruebas.
- No hay secretos en el historial ni vulnerabilidades críticas. Las dos altas del backend son transitivas, solo de la CLI de Prisma, y no están en la ruta de una petición.
- El hallazgo de mayor prioridad es el endurecimiento del login (H-03, H-04, H-05), que ya está asignado.

**Próximos pasos**

1. Fusionar los PR que contienen las correcciones del 20 de noviembre (#108, #109, #115, #118 y #120) y confirmar que CodeQL, gitleaks y Trivy quedan en verde en `main`.
2. Cerrar T-27 (H-03 a H-05) y T-35 y T-36 (H-06) antes de la entrega.
3. Cuando exista la URL de producción, medir las cabeceras con una herramienta de calificación y repetir el análisis de imágenes.
4. Actualizar Prisma para eliminar las dos altas transitivas (R-03) y revisar los PR de Dependabot cada semana.
5. Evaluar, si hay tiempo, comprobar el estado del usuario en cada petición (R-01) y desactivar `/docs` en producción (R-05).
