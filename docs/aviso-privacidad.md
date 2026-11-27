# Aviso de privacidad · Busca Fácil

Versión: 2026-11-25. T-14 · Issue #18 · Plane CLENA-35.

## Estado y responsable

Este es un aviso provisional del prototipo académico del catálogo bibliográfico del CLENA. El equipo del proyecto administra las demostraciones con datos ficticios. El responsable institucional del tratamiento, sus datos de contacto y la política definitiva deben ser confirmados por el CLENA antes de usar datos reales. No constituye asesoría jurídica formal ni evidencia de autorización institucional.

## Finalidades y datos mínimos

La consulta pública del catálogo no requiere una cuenta. Las cuentas prevén nombre, correo, credenciales protegidas, rol y datos de consentimiento. Los préstamos y reservas requieren identificar al lector; solo deben solicitarse datos de contacto cuando sean necesarios para prestar el servicio.

La búsqueda híbrida y semántica utiliza un modelo de embeddings de código abierto que corre en el propio servidor (ADR-08). Las consultas de búsqueda no se envían a servicios externos de IA ni a terceros.

La importación CSV trata datos bibliográficos. Su historial conserva la cuenta del administrador, el nombre del archivo, la fecha, los totales y los errores por fila. No se deben incluir datos personales de lectores en el archivo, su nombre o sus celdas. El importador no almacena el archivo CSV completo.

## Derechos del titular

De acuerdo con la Ley 1581 de 2012, el titular puede conocer, actualizar y rectificar sus datos, acceder gratuitamente a ellos, solicitar prueba de la autorización y conocer su uso. Puede solicitar supresión o revocatoria cuando proceda, considerando las obligaciones legales o contractuales de conservación, y presentar quejas ante la Superintendencia de Industria y Comercio conforme al procedimiento aplicable.

Fuente normativa: [Ley 1581 de 2012, artículos 8, 9, 12 y 15](https://normograma.dian.gov.co/dian/compilacion/docs/ley_1581_2012.htm).

## Canal y eliminación

Durante las demostraciones, las solicitudes sobre datos ficticios se tramitan con el equipo del proyecto. El canal institucional de contacto y la política aplicable están pendientes de confirmación con el CLENA. No se deben enviar datos personales por Issues públicos ni comentarios de GitHub o Plane.

La eliminación de cuentas desde la aplicación corresponde a HU-17 y aún no está disponible. Publicar este aviso no habilita esa función.

## Consentimiento

Texto propuesto: «He leído el aviso de privacidad y autorizo el tratamiento de mis datos para gestionar mi cuenta y los servicios de biblioteca que solicite».

El registro de lectores (`/registro`) presenta una casilla «Acepto el tratamiento de mis datos» sin preseleccionar y guarda `privacyVersion = 2026-11-25` y `consentAt` en User y en el Reader vinculado. Solo se recogen nombre completo, correo y la fecha de aceptación. Quien tiene cuenta puede eliminarla desde `/mi-cuenta` (confirmando con su contraseña): se anonimizan sus datos personales y se conserva el historial de préstamos sin identificarla. Leer la página pública no registra consentimiento.

## Licencia del código

El equipo adopta la licencia MIT ([`LICENSE`](../LICENSE)) para el código fuente del prototipo académico. Ni el CLENA ni el docente emitieron confirmación formal sobre la licencia, por lo que esta adopción refleja únicamente la decisión del equipo y no implica autorización institucional. La licencia del código no cubre ni autoriza el uso de datos reales, catálogos, logotipos ni archivos digitales de terceros.
