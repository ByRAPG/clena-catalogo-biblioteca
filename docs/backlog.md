# Product Backlog

> **Estado:** borrador propuesto por Backend para validar con el Grupo 9 en el kickoff (7 nov 2026).
> El Grupo 9 es el autor oficial de las historias: cada integrante revisa, ajusta y registra como Issue (etiqueta `historia-usuario`) las historias asignadas en la columna **Autor G9**. Backend estima los puntos; la prioridad MoSCoW se acuerda entre Humberto Llinás (PO) y Shadia Castro.

**Dónde ver el backlog**

| Lugar | Qué hay |
|---|---|
| Este archivo | Versión legible y completa |
| Plane → workspace `clena-library` → proyecto **Catálogo CLENA** → Work items | Descripción detallada, estimación, sprint (Cycles), módulo y dependencias. `HU-n` = `CLENA-n`; `T-01…T-14` = `CLENA-22…35` |
| GitHub → Issues y Projects del repositorio | Fuente oficial para el docente, cuando el G9 registre las historias |

## Usuarios (personas, nombres ficticios)

| Persona | Perfil | Comodidad con la tecnología | Le frustra hoy | Necesita lograr |
|---|---|---|---|---|
| **Doña Carmen, 70** | Jubilada, visita la biblioteca para leer novelas | Baja | No entiende el buscador actual y le da pena pedir ayuda cada vez | Encontrar un libro que recuerda a medias y saber a qué estante ir |
| **Andrés, 20** | Estudiante universitario | Alta | El sistema exige el título exacto o un código | Encontrar fuentes por tema y copiar la cita |
| **Luisa, 42** | Investigadora de historia local | Media | No sabe si un documento tiene versión digital o está prestado | Filtrar por tema y disponibilidad |
| **Marta, 35** | Bibliotecaria del CLENA | Media | Repite la misma explicación a cada visitante y lleva préstamos en papel | Mantener el catálogo y los préstamos al día y atender a quien de verdad lo necesita |

## Resumen

| ID | Historia | MoSCoW | Pts | Sprint | Desarrolla | Autor G9 |
|---|---|---|---|---|---|---|
| HU-01 | Buscar por parte del título, autor o tema | Debe | 5 | S1 | Orlando Palma | Shadia |
| HU-02 | Ver ubicación y disponibilidad del libro | Debe | 3 | S1 | Orlando Palma | Shadia |
| HU-03 | Búsqueda tolerante a errores y sin tildes | Debe | 5 | S2 | Orlando Palma | Shadia |
| HU-04 | Filtrar y ordenar resultados | Debe | 3 | S2 | Orlando Palma | Shadia |
| HU-05 | Inicio de sesión del personal con roles | Debe | 8 | S1 | Juan Camilo | Emiliano |
| HU-06 | Registrar y editar obras, autores y temas | Debe | 8 | S1 | Daniel Méndez | Emiliano |
| HU-07 | Gestionar ejemplares y su ubicación | Debe | 5 | S2 | Daniel Méndez | Emiliano |
| HU-08 | Importar el catálogo desde CSV | Debe | 8 | S2 | Daniel Méndez | Emiliano |
| HU-09 | Registrar préstamos y devoluciones | Debe | 8 | S2 | Humberto Llinás | Emiliano |
| HU-10 | Alertas de préstamos por vencer y vencidos | Debe | 5 | S3 | Humberto Llinás | Emiliano |
| HU-11 | Abrir la búsqueda escaneando un QR | Debe | 2 | S2 | Rafael Potes | Derek |
| HU-12 | Tutorial guiado en la primera búsqueda | Debe | 5 | S3 | Rafael Potes | Derek |
| HU-13 | Modo lectura fácil (letra grande, alto contraste) | Debe | 3 | S2 | Rafael Potes | Derek |
| HU-14 | Cuenta de lector con consentimiento y eliminación | Debe | 5 | S2 | Juan Camilo | Derek |
| HU-15 | Ver mis préstamos y pedir aviso de disponibilidad | Debería | 5 | S3 | Humberto Llinás | Emiliano |
| HU-16 | Copiar la cita bibliográfica | Debería | 2 | S3 | Orlando Palma | Shadia |
| HU-17 | Asistente de ayuda guiado (sin IA) | Debería | 5 | S3 | Juan Camilo | Derek |
| HU-18 | Pedir que un trabajador se acerque | Debería | 5 | S3 | Juan Camilo | Derek |
| HU-19 | Mapa de la biblioteca con el estante resaltado | Podría | 8 | S3 si hay capacidad | Daniel Méndez | Derek |
| HU-20 | Búsquedas sin resultado y más frecuentes | Podría | 3 | S3 | Orlando Palma | Shadia |
| HU-21 | Asistente conversacional con IA | No tendrá ahora | — | — | — | — |

14 historias «Debe tener» (mínimo exigido: 8) y 21 en total (mínimo: 12). Autoría G9: Shadia 7, Emiliano 7, Derek 7.

Capacidad por sprint: S1 = 24 pts · S2 = 39 pts · S3 = 30 pts (+8 opcional).

---

## Historias detalladas

### HU-01 · Buscar por parte del título, autor o tema
**Como** visitante de la biblioteca **quiero** buscar escribiendo solo una parte del título, del autor o del tema **para** encontrar el libro aunque no recuerde el nombre exacto.

- Dado que existe «Cien años de soledad», cuando escribo «cien años sole» y presiono Buscar, entonces aparece entre los 3 primeros resultados.
- Dado que escribo «garcia marquez», cuando presiono Buscar, entonces veo las obras de ese autor.
- Dado que no hay coincidencias, cuando presiono Buscar, entonces veo un mensaje claro con sugerencias y el botón «Necesito ayuda».
- Dado que hay muchos resultados, cuando se muestran, entonces aparecen paginados de 10 en 10 con título, autor, tipo y ubicación resumida.

### HU-02 · Ver ubicación y disponibilidad
**Como** visitante **quiero** ver la sala, la sección y el estante del libro y si está disponible **para** ir directo a buscarlo.

- Dado un resultado, cuando lo abro, entonces veo sala, sección y estante en letra grande.
- Dado que todos los ejemplares están prestados, cuando abro el detalle, entonces veo «No disponible» y la fecha estimada de devolución.
- Dado que la obra tiene versión digital, cuando abro el detalle, entonces veo el enlace «Ver versión digital».

### HU-03 · Búsqueda tolerante a errores
**Como** adulto mayor **quiero** que la búsqueda encuentre el libro aunque escriba con errores o sin tildes **para** no frustrarme.

- Dado que escribo «soledda» o «garsia», cuando busco, entonces obtengo resultados relevantes.
- Dado que escribo «Bogota» sin tilde, cuando busco, entonces encuentra «Bogotá».
- Dado que escribo en mayúsculas, minúsculas o mezcla, cuando busco, entonces el resultado es el mismo.

### HU-04 · Filtrar y ordenar
**Como** estudiante **quiero** filtrar por tema, tipo de material, disponibilidad y formato, y ordenar los resultados **para** llegar rápido a lo que necesito.

- Dado una búsqueda con resultados, cuando marco «Solo disponibles», entonces solo veo obras con al menos un ejemplar disponible.
- Dado una búsqueda, cuando filtro por tema «Historia», entonces solo veo obras de ese tema.
- Dado una búsqueda, cuando ordeno por año, entonces los resultados se reordenan sin perder los filtros.

### HU-05 · Inicio de sesión del personal con roles
**Como** personal del CLENA **quiero** iniciar sesión y ver solo las funciones de mi rol **para** proteger el catálogo.

- Dado un usuario del personal válido, cuando inicia sesión, entonces entra al panel y su sesión se renueva sin volver a escribir la contraseña mientras siga activo.
- Dado un usuario público, cuando intenta entrar al panel de administración, entonces el sistema lo impide y lo lleva al inicio.
- Dado 5 intentos fallidos seguidos, cuando intenta de nuevo, entonces debe esperar unos minutos.
- Dado que cierro sesión, cuando intento volver al panel, entonces debo iniciar sesión otra vez.

### HU-06 · Registrar y editar obras
**Como** personal **quiero** registrar y editar obras con sus autores y temas **para** mantener el catálogo al día.

- Dado el formulario de obra, cuando guardo título, autores y temas, entonces la obra aparece en la búsqueda pública.
- Dado que falta el título, cuando intento guardar, entonces veo un mensaje junto al campo.
- Dado un autor que ya existe, cuando lo escribo, entonces el sistema lo sugiere en lugar de duplicarlo.

### HU-07 · Gestionar ejemplares y ubicación
**Como** personal **quiero** registrar los ejemplares de cada obra con su sala, sección y estante **para** que los visitantes los encuentren.

- Dado una obra, cuando agrego un ejemplar con su ubicación, entonces el detalle público muestra esa ubicación.
- Dado un ejemplar, cuando lo cambio de estante, entonces la búsqueda muestra la nueva ubicación de inmediato.
- Dado que doy de baja un ejemplar, cuando consulto la obra, entonces ya no cuenta como disponible.

### HU-08 · Importar catálogo desde CSV
**Como** administrador **quiero** importar el catálogo desde un archivo CSV con reporte de errores **para** no digitarlo a mano.

- Dado un CSV válido de 500 filas, cuando lo importo, entonces se crean o actualizan obras, autores, temas y ejemplares sin duplicados.
- Dado un CSV con filas inválidas, cuando lo importo, entonces veo un reporte por fila con el error y las filas válidas sí se importan.
- Dado la pantalla de importación, cuando la abro, entonces puedo descargar una plantilla CSV de ejemplo.

### HU-09 · Registrar préstamos y devoluciones
**Como** personal **quiero** registrar préstamos y devoluciones **para** saber qué ejemplares están prestados.

- Dado un ejemplar disponible y un lector registrado, cuando registro el préstamo, entonces el ejemplar queda «Prestado» con la fecha de devolución calculada.
- Dado un ejemplar prestado, cuando intento prestarlo de nuevo, entonces el sistema lo impide con un mensaje claro.
- Dado un préstamo activo, cuando registro la devolución, entonces el ejemplar vuelve a «Disponible».

### HU-10 · Alertas de préstamos
**Como** personal **quiero** ver y recibir alertas de préstamos próximos a vencer y vencidos **para** recuperar el material a tiempo.

- Dado un préstamo que vence en menos de 48 horas, cuando corre la revisión diaria, entonces el lector con correo recibe un recordatorio y el panel lo marca «Por vencer».
- Dado un préstamo vencido, cuando abro el panel, entonces aparece primero en la lista de alertas.
- Dado que la revisión corre dos veces el mismo día, cuando termina, entonces no se envía el mismo correo dos veces.

### HU-11 · Acceso por QR
**Como** visitante **quiero** escanear un código QR en la sala **para** abrir la búsqueda en mi celular sin instalar nada.

- Dado el QR impreso en la sala, cuando lo escaneo, entonces se abre la página de búsqueda adaptada al celular.
- Dado el panel del personal, cuando genero el QR de una sala, entonces puedo descargarlo para imprimir.

### HU-12 · Tutorial guiado
**Como** visitante nuevo **quiero** un tutorial guiado en mi primera búsqueda **para** aprender a usar el sistema sin pedir ayuda.

- Dado que es mi primera visita en este dispositivo, cuando abro el buscador, entonces aparece un recorrido de máximo 4 pasos.
- Dado el tutorial, cuando presiono «Saltar», entonces no vuelve a aparecer, pero puedo abrirlo desde «¿Cómo buscar?».
- Dado el tutorial, cuando lo recorro con el teclado, entonces puedo avanzar y cerrarlo sin mouse.

### HU-13 · Modo lectura fácil
**Como** adulto mayor **quiero** activar letra grande y alto contraste **para** leer cómodamente.

- Dado cualquier pantalla pública, cuando activo «Letra grande», entonces el texto crece sin romper el diseño.
- Dado que activo «Alto contraste», cuando recargo la página, entonces se mantiene mi preferencia.
- Dado el modo normal, cuando lo reviso, entonces el texto mínimo es de 16 px y el contraste cumple AA.

### HU-14 · Cuenta de lector con consentimiento
**Como** lector **quiero** crear una cuenta aceptando el aviso de privacidad y poder eliminarla **para** controlar mis datos (Ley 1581 de 2012).

- Dado que no acepto el aviso de privacidad, cuando intento registrarme, entonces no se crea la cuenta.
- Dado el registro, cuando lo completo, entonces solo se piden nombre, correo y contraseña.
- Dado que elimino mi cuenta, cuando confirmo, entonces mis datos personales se borran o anonimizan y no puedo volver a iniciar sesión.

### HU-15 · Mis préstamos y aviso de disponibilidad
**Como** lector **quiero** ver mis préstamos y pedir que me avisen cuando un libro esté disponible **para** no volver en vano.

- Dado que tengo sesión, cuando abro «Mis préstamos», entonces veo cada préstamo con su fecha de devolución.
- Dado un libro no disponible, cuando presiono «Avísame», entonces recibo un correo cuando se devuelva un ejemplar.

### HU-16 · Copiar cita bibliográfica
**Como** estudiante **quiero** copiar la cita bibliográfica del libro **para** usarla en mis trabajos.

- Dado el detalle de una obra, cuando presiono «Copiar cita», entonces se copia en formato APA y veo la confirmación «Cita copiada».

### HU-17 · Asistente de ayuda guiado (sin IA)
**Como** visitante **quiero** un asistente de ayuda con opciones para tocar **para** resolver mis dudas sin tener que escribir ni esperar al personal.

- Dado cualquier pantalla pública, cuando presiono «Necesito ayuda», entonces se abre un asistente con preguntas frecuentes en botones grandes («No encuentro mi libro», «¿Cómo llego al estante?», «¿Cómo pido un préstamo?»).
- Dado que elijo una opción, cuando la abro, entonces veo una respuesta corta y paso a paso, y las opciones «Esto me ayudó» o «Hablar con una persona».
- Dado que el personal edita las preguntas y respuestas desde el panel, cuando guarda, entonces el asistente muestra el contenido nuevo.
- El asistente no usa IA ni servicios pagos: sigue un árbol de opciones definido por el personal.

### HU-18 · Pedir que un trabajador se acerque
**Como** visitante **quiero** pedir que un trabajador se acerque a ayudarme **para** no tener que levantarme a buscarlo.

- Dado el asistente, cuando elijo «Hablar con una persona» e indico dónde estoy (equipo o sala), entonces el personal ve la solicitud en su panel con la hora.
- Dado una solicitud abierta, cuando el personal la marca «En camino», entonces el visitante ve ese estado en su pantalla.
- Dado una solicitud atendida, cuando el personal la cierra, entonces sale de la lista de pendientes.

### HU-19 · Mapa de la biblioteca
**Como** visitante **quiero** ver un mapa simple de la biblioteca con el estante resaltado **para** ubicarme sin preguntar.

- Dado el detalle de una obra, cuando presiono «Ver en el mapa», entonces veo el plano de la sala con el estante resaltado y puntos de referencia.

### HU-20 · Búsquedas sin resultado
**Como** administrador **quiero** ver las búsquedas sin resultado y las más frecuentes **para** decidir qué material adquirir o cómo mejorar el catálogo.

- Dado el panel de administración, cuando abro «Búsquedas», entonces veo las 20 búsquedas más frecuentes y las 20 sin resultado del último mes, sin datos personales.

### HU-21 · Asistente conversacional con IA (No tendrá ahora)
Mejora futura descartada para esta etapa por costo y complejidad, como propuso el Grupo 9. El asistente guiado (HU-17) se diseña para que pueda reemplazarse después.

---

## Habilitadores técnicos

| ID | Trabajo | Sprint | Responsable |
|---|---|---|---|
| T-01 | Repositorio, protección de `main`, plantillas, etiquetas, milestones, GitHub Project | Inception | Rafael Potes |
| T-02 | Esqueleto NestJS con Clean Architecture, config, logs, errores uniformes, Swagger, `/health` | Inception–S1 | Rafael Potes + Juan Camilo |
| T-03 | Esqueleto React + Vite + Mantine con tema accesible y rutas | Inception–S1 | Orlando Palma |
| T-04 | docker-compose (PostgreSQL, API, web, Mailpit) | Inception | Rafael Potes |
| T-05 | GitHub Actions: lint, pruebas, e2e y build en cada PR | Inception–S1 | Rafael Potes |
| T-06 | Modelo de dominio, diagrama ER, migraciones Prisma, semillas e índices | Inception–S1 | Daniel Méndez |
| T-07 | Despliegue con URL pública | S1 | Rafael Potes |
| T-08 | Documento de arquitectura y decisiones (ADR) | Inception–S3 | Rafael Potes (revisa Humberto Llinás) |
| T-09 | Pruebas e2e y cobertura ≥ 70 % | S2–S3 | Cada responsable de módulo |
| T-10 | Manual de usuario | S3 | Humberto Llinás |
| T-11 | Manual de operación y respaldo de base de datos | S3 | Rafael Potes |
| T-12 | Actas Scrum y evidencias | Continuo | Rafael Potes |
| T-13 | Swagger completo / colección Postman | S3 | Juan Camilo |
| T-14 | Aviso de privacidad y licencia | S1 | Humberto Llinás |
