# Manual de usuario · Consulta Fácil

**Proyecto:** Catálogo bibliográfico accesible para la Biblioteca del CLENA (Universidad del Norte)  
**Tarea:** T-10 · Issue #14 · Plane `CLENA-31`  
**Versión:** 1.0 · 25 de noviembre de 2026  

---

## 1. Introducción

**Consulta Fácil** (también visible en la interfaz pública como **Busca Fácil**) es el catálogo bibliográfico web diseñado para la Biblioteca del CLENA. Su objetivo principal es que cualquier persona —incluidos adultos mayores y usuarios con baja visión— pueda encontrar libros de forma sencilla, saber si están disponibles y ubicar exactamente en qué sala, sección y estante se encuentran, sin necesidad de conocer códigos bibliográficos ni pedir ayuda en el mostrador.

Para el personal de la biblioteca y los administradores, la aplicación ofrece un panel protegido para registrar libros, descargar códigos QR para imprimir en las salas e importar el catálogo de forma masiva desde archivos CSV.

### 1.1. Perfiles de uso y permisos

La aplicación organiza el acceso en tres niveles:

| Perfil | Requiere cuenta | Qué puede hacer |
|---|---|---|
| **Visitante** (público general) | No | Buscar libros, filtrar por categoría/sala/disponibilidad, abrir la ficha de cada obra, ver ubicaciones y enlaces digitales, usar las opciones de accesibilidad, repetir el recorrido guiado y consultar el aviso de privacidad. |
| **Personal (`STAFF`)** | Sí (`/ingresar`) | Todo lo del visitante, más acceder a **Gestión** (`/gestion`), **Registrar libro** (`/gestion/registrar-libro`) y descargar **Códigos QR** de la entrada y de cada sala. |
| **Administración (`ADMIN`)** | Sí (`/ingresar`) | Todo lo del personal, más **Importar catálogo** desde CSV (`/gestion/importar`) y descargar la plantilla CSV de ejemplo. |

### 1.2. Requisitos de acceso

- Un navegador web moderno actualizado (Chrome, Edge, Firefox o Safari) en computador, tableta o teléfono celular (diseñado desde **360 px** de ancho sin necesidad de hacer zoom).
- No requiere instalar ninguna aplicación adicional.
- La consulta pública no solicita cuenta ni datos personales.

---

## 2. Guía para visitantes (búsqueda y consulta)

### 2.1. Abrir el catálogo y escanear códigos QR

Puede ingresar al catálogo de dos formas:

1. **Desde el navegador:** escriba la dirección web del catálogo en su computador o celular. Se abrirá directamente la pantalla principal de búsqueda (`/`).
2. **Escaneando un código QR:**
   - **QR de la entrada:** al escanearlo con la cámara del celular se abre el buscador general del catálogo adaptado a pantalla pequeña.
   - **QR de una sala:** cada sala de la biblioteca puede tener su propio código QR impreso. Al escanearlo, el buscador se abre automáticamente con el filtro de **Sala** aplicado para mostrar los libros ubicados en ese espacio.

### 2.2. Recorrido guiado de la primera búsqueda

La primera vez que visite el catálogo desde un dispositivo, aparecerá un recorrido guiado paso a paso pensado para aprender a usar el buscador sin ayuda:

- **Navegación:** puede avanzar entre pasos con los botones en pantalla o usando únicamente el teclado (`Tab` para moverse entre botones, `Enter` o `Espacio` para activar, `Esc` para cerrar).
- **Saltar o finalizar:** si presiona **Saltar** o llega al último paso, el recorrido se cierra y no vuelve a abrirse automáticamente en futuras visitas desde ese navegador.
- **Volver a abrirlo:** en cualquier momento puede iniciar el recorrido de nuevo desde el botón **¿Cómo buscar?** disponible en la pantalla principal.

### 2.3. Opciones de accesibilidad

La interfaz pública está diseñada con texto base legible (mínimo 18 px), alto contraste conforme a WCAG AA, botones amplios (mínimo 44 px de alto) y soporte completo para teclado.

En la parte superior de **todas las pantallas** (o dentro del botón **Menú** en pantallas angostas) encontrará dos controles conmutables:

| Control | Efecto | Persistencia |
|---|---|---|
| **Letra más grande** | Aumenta el tamaño general de los textos para facilitar la lectura. | Se guarda automáticamente en el dispositivo aunque recargue o cierre el navegador. |
| **Alto contraste** | Refuerza el contraste entre fondos, bordes, enlaces y textos. | Se guarda automáticamente en el dispositivo. |

Además, si navega con teclado, al presionar `Tab` al cargar cualquier página aparecerá el enlace **Saltar al contenido**, que lleva el foco directamente al contenido principal sin tener que recorrer toda la cabecera.

### 2.4. Buscar libros por título, autor o tema

En la pantalla principal (`/`) encontrará la caja de búsqueda:

1. Escriba una parte del título, el nombre del autor o un tema de interés (por ejemplo: `cien años sole`, `garcia marquez` o `historia del caribe`).
2. Presione la tecla `Enter` o haga clic/toque en el botón **Buscar**.

El buscador cuenta con las siguientes ayudas integradas:

- **Tolerancia a errores de escritura:** si escribe una palabra con un error menor (por ejemplo, `soledda` o `soleda`), el sistema sigue encontrando las obras parecidas.
- **Sin distinción de tildes ni mayúsculas:** buscar `SOLEDAD`, `soledád` o `soledad` devuelve los mismos resultados.
- **Búsqueda por coincidencia y por significado:**
  - Las tarjetas muestran **«Coincide en…»** para indicar si el término apareció en el título, el autor o el tema.
  - Cuando la búsqueda semántica local está activa, el catálogo también puede mostrar **«Coincide por significado»** para libros relacionados con la idea buscada aunque no usen exactamente las mismas palabras. Este procesamiento corre en el propio servidor y no envía sus consultas a terceros.
- **Paginación:** cuando hay más de 10 resultados, se muestran paginados de 10 en 10 con controles para ir a la página anterior o siguiente.

### 2.5. Filtrar resultados

Debajo o junto al buscador dispone de tres filtros que actualizan la lista de inmediato sin recargar la página:

1. **Categoría:** despliegue la lista y elija un área temática (por defecto muestra *Todas*).
2. **Sala:** seleccione una sala física de la biblioteca (por defecto muestra *Todas*).
3. **Solo disponibles:** marque esta casilla para ver únicamente libros que tengan al menos un ejemplar disponible en este momento.

Para volver a ver todos los resultados sin restricciones, presione **Quitar filtros**.

### 2.6. Leer una tarjeta de resultado y abrir la ficha de la obra

Cada tarjeta en la lista de resultados resume:

- **Título** (enlace a la ficha completa), **autor** y **temas**.
- **Disponibilidad:**
  - **Disponible** (en verde, siempre acompañado de texto y no solo color) si al menos un ejemplar está disponible.
  - **No disponible** (en naranja) cuando todos los ejemplares están prestados, en mantenimiento o dados de baja.
- **Ubicación rápida:** sala, sección y estante principal del libro.

Al hacer clic o tocar el título se abre la **ficha de detalle de la obra** (`/obras/:id`), donde puede consultar:

- Título completo, subtítulo, autores y temas (con los términos buscados resaltados).
- Etiqueta de disponibilidad general.
- Botón **Ver versión digital** (solo aparece si la obra cuenta con un enlace web digital válido; se abre en una pestaña nueva).
- Tabla **Datos de la obra** (categoría, año de publicación y demás metadatos registrados).
- **Ejemplares y ubicaciones:** listado en letra grande con el código de inventario, la sala, la sección, el estante y el estado de cada copia física.
- Enlace **Volver al catálogo** para regresar a la búsqueda.

### 2.7. Aviso de privacidad

En el pie de todas las páginas está el enlace **Aviso de privacidad** (`/privacidad`), donde se detallan las finalidades de uso, el principio de datos mínimos, los derechos del titular bajo la **Ley 1581 de 2012**, el texto de consentimiento previsto y la licencia MIT del código fuente. Leer esta página no registra consentimiento ni recolecta datos personales.

---

## 3. Guía para el personal y administración

Las herramientas de gestión están reservadas al personal autorizado del CLENA (`STAFF`) y a los administradores (`ADMIN`). Si un visitante sin sesión intenta abrir una ruta de gestión, la aplicación lo redirige a `/ingresar`. Si una cuenta sin permiso intenta abrir una sección restringida (por ejemplo, un usuario `STAFF` entrando a `/gestion/importar`), se muestra la pantalla **No tiene permiso** (`/sin-permiso`).

### 3.1. Iniciar y cerrar sesión

1. Haga clic en **Ingresar** en la cabecera (o dentro de **Menú** en pantallas angostas), o abra directamente `/ingresar`.
2. Escriba su **correo electrónico** y su **contraseña**. Puede marcar la casilla para mostrar la contraseña y verificar lo escrito.
3. Presione el botón de ingreso. Si las credenciales son válidas, será dirigido automáticamente al panel **Gestión** (`/gestion`).

**Reglas de seguridad de la sesión:**

- Si el correo o la contraseña son incorrectos, la pantalla muestra *«Correo o contraseña incorrectos. Revisa tus datos y vuelve a intentarlo»* sin revelar cuál de los dos datos falló.
- Tras cinco intentos fallidos consecutivos, el sistema aplica un **bloqueo temporal de 15 minutos** a esa cuenta. Durante el bloqueo la pantalla sigue mostrando el mismo mensaje de «Correo o contraseña incorrectos», incluso con la contraseña correcta, para no revelar si la cuenta existe. Espere 15 minutos antes de reintentar o pida ayuda a la administración de la biblioteca.
- Mientras siga trabajando en el sistema, la sesión se renueva de forma automática sin pedir nuevamente la contraseña.
- Al terminar su turno —especialmente en computadores compartidos—, presione **Cerrar sesión** en la cabecera. Una vez cerrada la sesión, deberá ingresar nuevamente para volver al panel.

### 3.2. Panel de gestión del catálogo

Al ingresar a `/gestion` verá las tarjetas de tareas disponibles según su rol:

| # | Tarea | Ruta | Roles permitidos | Descripción |
|---|---|---|---|---|
| 01 | **Registrar libro** | `/gestion/registrar-libro` | `STAFF`, `ADMIN` | Dar de alta una obra nueva con sus autores, temas, categoría y año. |
| 02 | **Importar catálogo** | `/gestion/importar` | Solo `ADMIN` | Cargar o actualizar múltiples libros a la vez desde un archivo CSV. |
| 03 | **Códigos QR** | `/gestion#codigos-qr` | `STAFF`, `ADMIN` | Descargar las imágenes QR de entrada y por sala listas para imprimir. |
| 04 | **Ver el catálogo** | `/` | `STAFF`, `ADMIN` | Abrir la vista pública para comprobar cómo aparecen los libros y fichas. |

Los usuarios con rol `STAFF` verán una nota indicando que la importación CSV está habilitada únicamente para administración.

### 3.3. Registrar un libro nuevo

Desde `/gestion`, elija **Registrar libro** (`/gestion/registrar-libro`):

1. **Título** *(obligatorio)*: escriba el título principal de la obra.
2. **Autores** *(obligatorio)*: escriba el nombre del autor. Mientras escribe, el sistema consulta y sugiere autores ya existentes en el catálogo para evitar duplicados; selecciónelo de la lista o presione `Enter` para agregar uno nuevo.
3. **Temas** *(opcional)*: agregue uno o varios temas usando las sugerencias existentes o escribiendo términos nuevos.
4. **Categoría** *(opcional)*: elija una categoría del listado (*Sin categoría* si no aplica).
5. **Año** *(opcional)*: ingrese el año de publicación como número entero válido.
6. Presione el botón para guardar.

**Resultado:**

- Si faltan campos obligatorios (como el título o al menos un autor) o el año no es un número válido, el formulario muestra el error junto al campo correspondiente y no guarda el registro.
- Al guardarse correctamente, aparece el aviso **Libro registrado** y la obra queda disponible de inmediato en la búsqueda pública.

### 3.4. Importar el catálogo desde CSV (solo administradores)

Desde `/gestion`, elija **Importar catálogo** (`/gestion/importar`):

1. **Descargar la plantilla:** haga clic en **Descargar plantilla de ejemplo** para obtener `plantilla-catalogo.csv` con las columnas exactas esperadas por el sistema.
2. **Preparar el archivo:**
   - Complete los registros bibliográficos en un editor de texto o en Microsoft Excel / LibreOffice Calc.
   - Si trabaja en Excel, guarde el archivo en formato **CSV UTF-8 (delimitado por comas)** (`.csv`).
   - El tamaño máximo permitido por archivo es de **1 MB**.
   - **Regla de privacidad:** incluya únicamente datos bibliográficos ficticios o debidamente autorizados. **Nunca** incluya datos personales de lectores en el contenido ni en el nombre del archivo.
3. **Cargar e importar:**
   - Seleccione el archivo en el campo **Archivo CSV**.
   - Presione **Importar** y espere mientras se procesa (se mostrará el aviso *«Importando el archivo, puede tardar unos segundos…»*).
4. **Revisar el informe de resultados:**
   - La importación procesa el archivo fila por fila: **las filas válidas se importan aunque otras filas contengan errores**.
   - Al finalizar, verá el resumen de totales (filas procesadas, creadas/actualizadas y con error) junto con el detalle del número de fila y el motivo de cada error para que pueda corregirlo y reimportar.
   - El sistema conserva el historial de la importación (administrador, nombre del archivo, fecha, totales y errores), pero **no almacena el archivo CSV completo**.

### 3.5. Descargar e imprimir códigos QR

En la parte inferior de `/gestion` (sección **Códigos QR**, `#codigos-qr`) el personal puede obtener imágenes listas para imprimir y pegar en la biblioteca:

1. **QR de entrada:** haga clic en **Descargar QR de entrada**. Al escanearlo, los visitantes abren el buscador general.
2. **QR por sala:** debajo aparece el listado de salas registradas en el catálogo. Haga clic en el botón de descarga junto a la sala deseada para guardar su imagen PNG. Al escanear ese código, el celular del visitante abrirá el catálogo filtrado automáticamente en esa sala.

Si la lista de salas no carga por un problema de red, utilice el botón de reintento o verifique su conexión.

---

## 4. Solución de problemas frecuentes

| Situación | Causa probable | Qué hacer |
|---|---|---|
| No aparecen resultados al buscar | Término demasiado específico o combinación restrictiva de filtros. | Presione **Quitar filtros**, use menos palabras o pruebe con el apellido del autor o un tema más amplio. |
| El texto se ve pequeño o cuesta distinguir los botones | Tamaño de pantalla o preferencia visual del dispositivo. | Active **Letra más grande** y/o **Alto contraste** en la parte superior de la pantalla. |
| No puedo iniciar sesión y aparece un contador de espera | Se alcanzó el límite de intentos fallidos de ingreso. | Espere a que termine el tiempo indicado en pantalla y verifique correo y contraseña usando la opción de mostrar contraseña. |
| Al entrar a `/gestion/importar` dice «No tiene permiso» | Su cuenta tiene rol `STAFF` (Personal) y no `ADMIN`. | Solicite a un administrador del CLENA realizar la importación CSV o revisar los permisos de su cuenta. |
| La importación CSV reporta errores en varias filas | Archivo guardado con codificación distinta a UTF-8, separador distinto a coma, columnas faltantes o datos inválidos. | Descargue `plantilla-catalogo.csv`, verifique que esté guardado como **CSV UTF-8 separado por comas** y revise cada número de fila reportado. |
| Un QR de sala no descarga | La sesión expiró o hubo un corte temporal de red. | Verifique que su sesión siga activa en la cabecera; si es necesario, vuelva a ingresar en `/ingresar` e intente la descarga nuevamente. |

---

## 5. Alcance del prototipo y notas finales

- Este manual refleja fielmente las funcionalidades integradas en la rama principal (`main`) de **Consulta Fácil** al 25 de noviembre de 2026.
- Durante las demostraciones académicas, el catálogo utiliza únicamente **datos bibliográficos ficticios**. Antes de cargar información real del CLENA deben confirmarse la autorización institucional, el responsable del tratamiento de datos personales y el canal oficial de atención (ver [Aviso de privacidad](aviso-privacidad.md)).
- Funcionalidades adicionales del backlog previstas para evolución posterior (como cuentas de lector, reservas, eliminación autónoma de cuenta o módulo completo de préstamos y alertas) se documentarán en versiones posteriores de este manual una vez integradas en producción.
