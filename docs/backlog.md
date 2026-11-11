# Product Backlog · Consulta Fácil

> **Estado:** versión 2 (6 nov 2026). Las historias HU-01…HU-14 las escribió el Grupo 9 ([issues originales](https://github.com/ImDER3K/clena-laboratorio-sistemas-grupo-9/issues)). Backend las ajustó al formato del enunciado (criterios Dado/Cuando/Entonces) y propuso HU-15…HU-21 para cubrir el alcance mínimo del P2 y los requisitos transversales. **El Grupo 9 valida, corrige y registra** cada historia como Issue en este repositorio (columna **Autor G9**). Backend estima los puntos. Priorizan Humberto Llinás Marimón (PO Backend) y Emiliano Harvey (PO G9).

**Dónde ver el backlog**

| Lugar | Qué hay |
|---|---|
| GitHub Issues (`historia-usuario`) y GitHub Projects | **Fuente oficial** para el docente: lo que no esté ahí no se califica |
| Este archivo | Versión legible para preparar los Issues y consultar rápido |
| Plane, proyecto `CLENA` | Planificación interna. `HU-n` = `CLENA-n`; `T-01…T-19` = `CLENA-22…40` |

## Reglas que cumple este backlog

| Exigencia | Fuente | Cómo se cumple |
|---|---|---|
| ≥ 15 historias en Issues que cubran todo el alcance mínimo | Entrega 1 Backend, E2 | 21 historias |
| «Como… quiero… para…» y ≥ 2 criterios Dado/Cuando/Entonces | E2 · Entrega 1 G9 (2 a 4 criterios) | Cada historia tiene 2 a 4 |
| Puntos Fibonacci y etiquetas `prioridad:alta/media/baja` | E2 | Columna Pts y Prioridad |
| MoSCoW con ≥ 8 «Debe tener» | Entrega 1 G9 | 18 «Debe» |
| Historias transversales: autenticación, roles, accesibilidad, Ley 1581 | E2 | HU-09, HU-18, HU-04, HU-16, HU-17 |
| Cada integrante del G9 es autor de ≥ 3 | Entrega 1 G9 | 7 por integrante |
| Validación del G9 | E2 | Comentario «Validada por el Grupo 9» en cada Issue + firma del acta de Inception |

Equivalencia de prioridad: **Debe tener = `prioridad:alta`**, **Debería = `prioridad:media`**, **Podría = `prioridad:baja`**, **No tendrá ahora = `no-ahora`**.

## Usuarios (borrador; el G9 entrega las personas oficiales con fotos de la visita)

| Persona | Perfil | Comodidad con la tecnología | Le frustra hoy | Necesita lograr |
|---|---|---|---|---|
| **Doña Carmen, 70** | Jubilada, lee novelas en la biblioteca | Baja | No entiende el buscador actual y le da pena pedir ayuda | Encontrar un libro que recuerda a medias y saber a qué estante ir |
| **Andrés, 20** | Estudiante universitario | Alta | El sistema exige el título exacto o un código | Buscar por tema desde el celular |
| **Luisa, 42** | Investigadora de historia local | Media | No sabe si un documento tiene versión digital o está prestado | Filtrar por tema y disponibilidad |
| **Marta, 35** | Bibliotecaria del CLENA | Media | Repite la misma explicación y lleva préstamos en papel | Mantener catálogo y préstamos al día |

## Resumen

| ID | Historia | Origen | MoSCoW | Prioridad | Pts | Sprint | Desarrolla | Autor G9 |
|---|---|---|---|---|---|---|---|---|
| HU-01 | Buscar por parte del título | G9 #1 | Debe | alta | 5 | S1 | Orlando Palma | Shadia |
| HU-02 | Buscar por autor o tema | G9 #2 | Debe | alta | 3 | S1 | Orlando Palma | Shadia |
| HU-03 | Ver la ubicación del libro | G9 #3 | Debe | alta | 2 | S1 | Orlando Palma | Shadia |
| HU-04 | Interfaz legible para adultos mayores | G9 #4 | Debe | alta | 3 | S1 | Rafael Potes | Derek |
| HU-05 | Abrir el catálogo escaneando un QR | G9 #5 | Debe | alta | 2 | S1 | Rafael Potes | Derek |
| HU-06 | Ver la disponibilidad (física o digital) | G9 #6 | Debe | alta | 3 | S1 | Daniel Méndez | Derek |
| HU-07 | Mensaje claro si no hay resultados | G9 #7 | Debería | media | 2 | S2 | Orlando Palma | Shadia |
| HU-08 | Filtrar por categoría o sala | G9 #8 | Debe | alta | 3 | S1 | Orlando Palma | Shadia |
| HU-09 | Iniciar sesión como bibliotecario | G9 #9 | Debe | alta | 5 | S1 | Juan Camilo Fernández | Emiliano |
| HU-10 | Registrar un libro nuevo | G9 #10 | Debe | alta | 5 | S1 | Daniel Méndez | Emiliano |
| HU-11 | Editar ubicación y estado de un libro | G9 #11 | Debe | alta | 3 | S1 | Daniel Méndez | Emiliano |
| HU-12 | Importar el catálogo desde CSV o Excel | G9 #12 | Debe | alta | 8 | S1 | Humberto Llinás | Emiliano |
| HU-13 | Búsqueda por voz | G9 #13 | Podría | baja | 3 | S3 | Orlando Palma | Shadia |
| HU-14 | Reservar un libro desde la app | G9 #14 | Debería | media | 5 | S2 | Juan Camilo Fernández | Derek |
| HU-15 | Tutorial guiado de la primera búsqueda | Backend | Debe | alta | 5 | S1 | Rafael Potes | Shadia |
| HU-16 | Crear cuenta de lector con aviso de privacidad | Backend | Debe | alta | 5 | S1 | Juan Camilo Fernández | Derek |
| HU-17 | Eliminar mi cuenta y mis datos | Backend | Debe | alta | 3 | S2 | Juan Camilo Fernández | Derek |
| HU-18 | Gestionar cuentas del personal y roles | Backend | Debe | alta | 3 | S1 | Juan Camilo Fernández | Emiliano |
| HU-19 | Registrar los ejemplares de un libro | Backend | Debe | alta | 3 | S1 | Daniel Méndez | Emiliano |
| HU-20 | Registrar préstamos y devoluciones | Backend | Debe | alta | 8 | S2 | Humberto Llinás | Emiliano |
| HU-21 | Alertas de devolución y disponibilidad | Backend | Debe | alta | 5 | S2 | Daniel Méndez | Derek |

- 21 historias: 18 «Debe», 2 «Debería», 1 «Podría». Autoría: Shadia 7, Derek 7, Emiliano 7.
- Sprint 1 (9–13 nov) = el **80 % obligatorio de la Entrega 1**: catálogo y CSV, búsqueda tolerante con filtros, ubicación y disponibilidad, QR y tutorial, login JWT, tres roles, aviso de privacidad, accesibilidad. 58 pts.
- Sprint 2 (14–19 nov) = el 20 % restante (préstamos y alertas) más reserva, eliminación de cuenta y mensaje sin resultados. 23 pts.
- Sprint 3 (20–25 nov) = búsqueda por voz si hay capacidad, despliegue estable, manuales, pruebas, aceptación. 3 pts.

## Qué cambió frente a los Issues originales del G9

| Historia | Cambio propuesto por Backend | Motivo |
|---|---|---|
| Todas | Criterios reescritos en formato Dado/Cuando/Entonces | Lo exigen ambos enunciados |
| HU-01 | Se agrega tolerancia a errores de escritura | Alcance mínimo P2 |
| HU-03 | Se aclara que la ubicación aparece en el detalle y en la tarjeta | Ubicación por ejemplar |
| HU-06 | Se agrega disponibilidad **digital** | Alcance mínimo P2 («física o digital») |
| HU-09 | Se agrega cierre de sesión y renovación de sesión (refresh token) | Requisito transversal JWT |
| HU-11 | La ubicación y el estado se editan por **ejemplar** | Un libro puede tener varias copias en estantes distintos |
| HU-12 | CSV obligatorio; Excel se acepta guardándolo como CSV | Alcance mínimo P2 dice CSV |
| HU-13 | Pasa a «Podría» | No es alcance mínimo; depende del navegador |
| HU-14 | Pasa a «Debería» y requiere cuenta de lector | No es alcance mínimo; depende de HU-16 |
| HU-15 a HU-21 | Nuevas | Faltaban en el alcance mínimo o son transversales |

## Sugerencias de Backend (fuera del backlog comprometido)

Ideas que el G9 puede convertir en historia «Podría» o «No tendrá ahora» si les parecen útiles: copiar la cita bibliográfica (mencionada en su informe), mapa de la biblioteca con el estante resaltado (propuesta de Derek en la reunión del 3 nov), búsquedas más frecuentes y sin resultado para el personal, botón «Necesito ayuda» que avisa a un trabajador y asistente con IA (mejora futura que el G9 descartó por costo). El **chat de atención** del informe del G9 era para la Sala de Internet; ese problema corresponde al proyecto «Buscador CLENA» (P1) y **no** está en el alcance de Consulta Fácil.

---

## Historias detalladas

> Texto listo para copiar en la plantilla «Historia de usuario». El autor G9 puede mejorar la redacción, pero sin quitar criterios.

### HU-01 · Buscar por parte del título
**Como** visitante de la biblioteca **quiero** buscar un libro escribiendo solo una parte del título **para** encontrarlo aunque no recuerde el nombre exacto.

- Dado que existe «Cien años de soledad», cuando escribo «cien años sole» y presiono Buscar, entonces aparece entre los 3 primeros resultados.
- Dado que escribo con un error, como «cien años soleda» o «soledda», cuando presiono Buscar, entonces igual aparece «Cien años de soledad».
- Dado que escribo «SOLEDAD» o «soledád», cuando presiono Buscar, entonces obtengo los mismos resultados que con «soledad».
- Dado que hay más de 10 resultados, cuando se muestran, entonces aparecen paginados de 10 en 10 en menos de 2 segundos.

### HU-02 · Buscar por autor o tema
**Como** estudiante o investigador **quiero** buscar por el nombre del autor o por un tema **para** explorar material relacionado con mi lectura o investigación.

- Dado que escribo «garcia marquez», cuando presiono Buscar, entonces veo las obras de Gabriel García Márquez.
- Dado que escribo el tema «historia del caribe», cuando presiono Buscar, entonces veo las obras con ese tema.
- Dado un resultado, cuando lo veo en la lista, entonces muestra el título, el autor y el tema que coincidió.

### HU-03 · Ver la ubicación del libro
**Como** visitante **quiero** ver la sala, la sección y el estante del libro **para** ir directo a buscarlo sin pedir ayuda.

- Dado un resultado de búsqueda, cuando lo veo en la lista, entonces la tarjeta muestra la sala, la sección y el estante.
- Dado que abro el detalle de un libro con varios ejemplares, cuando lo leo, entonces veo la ubicación de cada ejemplar en letra grande.

### HU-04 · Interfaz legible para adultos mayores
**Como** adulto mayor o persona con baja visión **quiero** textos grandes, botones claros y alto contraste **para** consultar sin frustrarme.

- Dado cualquier pantalla pública, cuando la abro, entonces el texto principal mide al menos 18 px y el contraste cumple WCAG AA.
- Dado que activo «Letra más grande» o «Alto contraste», cuando recargo la página, entonces se mantiene mi preferencia.
- Dado que uso solo el teclado, cuando navego por el buscador y los resultados, entonces llego a todos los botones y veo dónde está el foco.
- Dado un celular de 360 px de ancho, cuando abro el buscador, entonces nada se corta ni hay que hacer zoom.

### HU-05 · Abrir el catálogo escaneando un QR
**Como** visitante con celular **quiero** escanear un código QR en la entrada o en las salas **para** abrir el catálogo sin escribir direcciones.

- Dado el QR impreso, cuando lo escaneo, entonces se abre la página de búsqueda adaptada al celular.
- Dado el panel del personal, cuando descargo el QR de una sala, entonces obtengo una imagen lista para imprimir que abre el buscador con esa sala filtrada.

### HU-06 · Ver la disponibilidad del libro
**Como** visitante **quiero** saber si el libro está disponible, prestado o en mantenimiento, y si tiene versión digital, **para** no buscar algo que no está.

- Dado un libro con al menos un ejemplar disponible, cuando lo veo en los resultados, entonces aparece «Disponible» en verde, con texto y no solo color.
- Dado que todos los ejemplares están prestados o en mantenimiento, cuando lo veo, entonces aparece «No disponible» en naranja con el motivo.
- Dado un libro con versión digital, cuando abro el detalle, entonces veo el botón «Ver versión digital».

### HU-07 · Mensaje claro si no hay resultados
**Como** visitante **quiero** un mensaje amable y sugerencias cuando no encuentro nada **para** saber qué hacer.

- Dado que mi búsqueda no tiene coincidencias, cuando presiono Buscar, entonces veo «No encontramos libros con ese término» y sugerencias: revisar la escritura, usar menos palabras o preguntar en el mostrador.
- Dado que existe un término parecido en el catálogo, cuando no hay resultados, entonces el sistema me pregunta «¿Quisiste decir…?» con un enlace.

### HU-08 · Filtrar por categoría o sala
**Como** visitante **quiero** filtrar por categoría, sala y disponibilidad **para** explorar el material de un área de mi interés.

- Dado una búsqueda, cuando elijo la categoría «Historia», entonces solo veo libros de esa categoría.
- Dado una búsqueda, cuando elijo una sala o marco «Solo disponibles», entonces la lista se actualiza sin recargar la página.
- Dado filtros activos, cuando presiono «Quitar filtros», entonces vuelvo a ver todos los resultados.

### HU-09 · Iniciar sesión como bibliotecario
**Como** bibliotecario o administrador **quiero** iniciar sesión con usuario y contraseña **para** entrar al panel de gestión del catálogo.

- Dado credenciales válidas, cuando inicio sesión, entonces entro al panel que corresponde a mi rol.
- Dado una contraseña incorrecta, cuando intento entrar, entonces veo «Correo o contraseña incorrectos» sin revelar cuál falló; tras 5 intentos debo esperar unos minutos.
- Dado que mi sesión sigue activa, cuando pasan 15 minutos, entonces se renueva sin volver a escribir la contraseña.
- Dado que cierro sesión, cuando intento volver al panel, entonces debo iniciar sesión otra vez.

### HU-10 · Registrar un libro nuevo
**Como** bibliotecario **quiero** registrar un libro con título, autores, temas, categoría y año **para** mantener el catálogo actualizado.

- Dado el formulario, cuando guardo un libro con sus datos, entonces veo «Libro registrado» y aparece en la búsqueda pública.
- Dado que falta el título o el autor, cuando intento guardar, entonces veo el error junto al campo y no se guarda.
- Dado un autor o tema que ya existe, cuando lo escribo, entonces el sistema lo sugiere en lugar de duplicarlo.

### HU-11 · Editar ubicación y estado de un ejemplar
**Como** bibliotecario **quiero** cambiar la ubicación o el estado de un ejemplar **para** reflejar reubicaciones o mantenimiento.

- Dado un ejemplar, cuando cambio su estante y guardo, entonces la búsqueda pública muestra la nueva ubicación de inmediato.
- Dado un ejemplar, cuando lo marco «En mantenimiento», entonces deja de contar como disponible.
- Dado un usuario público, cuando intenta editar un ejemplar, entonces el sistema lo impide.

### HU-12 · Importar el catálogo desde CSV o Excel
**Como** administrador **quiero** importar el catálogo desde un archivo CSV (o Excel guardado como CSV) **para** no registrar cada libro a mano.

- Dado un CSV válido de 500 filas, cuando lo importo, entonces se crean o actualizan libros, autores, temas y ejemplares sin duplicados.
- Dado un CSV con filas incompletas, cuando lo importo, entonces veo un reporte con el número de fila y el error, y las filas válidas sí se importan.
- Dado la pantalla de importación, cuando la abro, entonces puedo descargar una plantilla de ejemplo.

### HU-13 · Búsqueda por voz
**Como** adulto mayor **quiero** dictar lo que busco **para** no tener que escribir.

- Dado un navegador compatible, cuando presiono el micrófono y digo «cien años de soledad», entonces el texto aparece en la caja y se ejecuta la búsqueda.
- Dado un navegador sin reconocimiento de voz, cuando abro el buscador, entonces el botón del micrófono no aparece y la búsqueda escrita funciona igual.

### HU-14 · Reservar un libro desde la app
**Como** lector registrado **quiero** apartar un libro disponible **para** asegurar que esté cuando llegue a la biblioteca.

- Dado un libro con un ejemplar disponible y mi sesión iniciada, cuando presiono «Reservar», entonces veo la confirmación y el plazo para recogerlo (por definir con el CLENA).
- Dado que vence el plazo sin recogerlo, cuando pasa la fecha, entonces la reserva se cancela y el ejemplar vuelve a estar disponible.
- Dado mi perfil, cuando lo abro, entonces veo mis reservas activas y puedo cancelarlas.

### HU-15 · Tutorial guiado de la primera búsqueda
**Como** visitante nuevo **quiero** un recorrido corto la primera vez que uso el buscador **para** aprender sin pedir ayuda.

- Dado que es mi primera visita en este dispositivo, cuando abro el buscador, entonces aparece un recorrido de máximo 4 pasos con letra grande.
- Dado el tutorial, cuando presiono «Saltar» o termino, entonces no vuelve a aparecer, pero puedo abrirlo desde «¿Cómo buscar?».
- Dado el tutorial, cuando uso solo el teclado, entonces puedo avanzar y cerrarlo sin mouse.

### HU-16 · Crear cuenta de lector con aviso de privacidad
**Como** visitante **quiero** crear una cuenta de lector aceptando el aviso de privacidad **para** reservar libros y recibir avisos, sabiendo cómo se usan mis datos (Ley 1581 de 2012).

- Dado el formulario de registro, cuando lo abro, entonces solo me pide nombre, correo y contraseña, y muestra el enlace al aviso de privacidad.
- Dado que no marco «Acepto el tratamiento de mis datos», cuando intento registrarme, entonces la cuenta no se crea.
- Dado que acepto, cuando me registro, entonces queda guardada la fecha y la versión del aviso que acepté.

### HU-17 · Eliminar mi cuenta y mis datos
**Como** lector **quiero** eliminar mi cuenta **para** ejercer mi derecho a que borren mis datos personales.

- Dado mi perfil, cuando presiono «Eliminar mi cuenta» y confirmo con mi contraseña, entonces mis datos personales se borran o anonimizan.
- Dado una cuenta eliminada, cuando intento iniciar sesión, entonces no puedo entrar.
- Dado que tengo un préstamo activo, cuando intento eliminar la cuenta, entonces el sistema me pide devolver el libro primero.

### HU-18 · Gestionar cuentas del personal y roles
**Como** administrador **quiero** crear cuentas del personal y asignar el rol de administrador o personal del CLENA **para** que cada uno vea solo lo que le corresponde.

- Dado el panel de usuarios, cuando creo una cuenta con rol «Personal», entonces esa persona puede gestionar el catálogo pero no los usuarios.
- Dado una cuenta del personal, cuando la desactivo, entonces ya no puede iniciar sesión.
- Dado un usuario con rol «Personal» o «Lector», cuando intenta abrir la gestión de usuarios, entonces el sistema lo impide.

### HU-19 · Registrar los ejemplares de un libro
**Como** bibliotecario **quiero** registrar cada ejemplar de un libro con su código de inventario y su ubicación **para** saber cuántas copias hay y dónde están.

- Dado un libro, cuando agrego un ejemplar con código, sala, sección y estante, entonces el detalle público muestra esa ubicación.
- Dado un código de inventario que ya existe, cuando intento guardarlo, entonces veo un error y no se duplica.
- Dado que doy de baja un ejemplar, cuando consulto el libro, entonces ya no cuenta como disponible.

### HU-20 · Registrar préstamos y devoluciones
**Como** bibliotecario **quiero** registrar préstamos y devoluciones **para** saber qué ejemplares están prestados y a quién.

- Dado un ejemplar disponible y un lector, cuando registro el préstamo, entonces el ejemplar queda «Prestado» con la fecha de devolución calculada.
- Dado un ejemplar prestado, cuando intento prestarlo otra vez, entonces el sistema lo impide con un mensaje claro.
- Dado un préstamo activo, cuando registro la devolución, entonces el ejemplar vuelve a «Disponible».

### HU-21 · Alertas de devolución y disponibilidad
**Como** bibliotecario y como lector **quiero** recibir avisos de préstamos por vencer o vencidos y de libros que vuelven a estar disponibles **para** recuperar el material a tiempo y no volver en vano.

- Dado un préstamo que vence en menos de 48 horas, cuando corre la revisión diaria, entonces el lector con correo recibe un recordatorio y el panel lo marca «Por vencer».
- Dado un préstamo vencido, cuando abro el panel, entonces aparece primero en la lista de alertas.
- Dado que pedí «Avísame cuando esté disponible», cuando se devuelve un ejemplar, entonces recibo un correo.
- Dado que la revisión corre dos veces el mismo día, cuando termina, entonces no se envía el mismo aviso dos veces.

---

## Habilitadores técnicos

| ID | Trabajo | Sprint | Responsable |
|---|---|---|---|
| T-01 | Repositorio, protección de `main`, plantillas, etiquetas, milestones, GitHub Project | S0 | Rafael Potes |
| T-02 | Esqueleto NestJS con las 4 capas, config, logs, filtro global de errores, Swagger `/docs`, `/api/v1/health`, Prisma y primera migración | S0 | Rafael Potes |
| T-03 | Esqueleto React + Vite + Mantine con tema accesible, rutas y cliente de la API | S0 | Orlando Palma |
| T-04 | Infraestructura Docker: `docker compose up` levanta PostgreSQL, backend y frontend sin pasos manuales | S0 | Humberto Llinás |
| T-05 | GitHub Actions: lint, pruebas y build en cada PR | S0 | Rafael Potes |
| T-06 | Modelo de datos: diagrama ER (draw.io), migraciones, semillas ficticias e índices → `docs/modelo-datos.pdf` | S0–S1 | Rafael Potes (esquema, migración y semilla) · Daniel Méndez (diagrama ER y PDF) |
| T-07 | Despliegue con URL pública | S3 | Rafael Potes |
| T-08 | Arquitectura C4 niveles 1–3 (draw.io) y decisiones → `docs/arquitectura.pdf` | S0–S1 | Rafael Potes (revisa Humberto) |
| T-09 | Pruebas e2e y cobertura ≥ 70 % | S2–S3 | Rafael Potes (cada responsable prueba su módulo) |
| T-10 | Manual de usuario | S3 | Humberto Llinás |
| T-11 | Manual de operación y respaldo de base de datos | S3 | Rafael Potes |
| T-12 | Actas Scrum, `docs/inception.pdf`, `docs/daily-scrum.pdf`, `docs/evidencias.pdf` | Continuo | Rafael Potes |
| T-13 | Modelo de dominio: diagrama de clases, reglas, glosario (≥ 10), casos de uso → `docs/modelo-dominio.pdf` | S0–S1 | Juan Camilo Fernández (revisa Humberto) |
| T-14 | Aviso de privacidad y licencia | S1 | Humberto Llinás |
| T-15 | Migrar el gestor de paquetes a pnpm (#24) | S1 | Rafael Potes |
| T-16 | Sincronizar la documentación con el estado real (#54) | S1 | Rafael Potes |
| T-17 | Semilla y plantilla CSV con datos ficticios, compatible con MARC21 (#55) | S1 | Rafael Potes (lista de libros: Daniel Méndez) |
| T-18 | Seguridad: Helmet, límite de peticiones, Secret scanning, Dependabot y CodeQL (#57) | S2 | Por asignar |
| T-19 | Imagen de producción y despliegue con URL, apoya a T-07 (#58) | S3 | Por asignar |
