# Definition of Done

Una historia o tarea está **terminada** solo si cumple todo lo siguiente.

## Funcional
- [ ] Cumple todos los criterios de aceptación de su Issue y de su work item en Plane.
- [ ] Se demostró en la URL desplegada (o en local si aún no hay despliegue, solo en Inception).

## Código
- [ ] Rama propia (`feat/<issue>-...`) creada desde `main` actualizado.
- [ ] Respeta Clean Architecture: `domain` sin `@nestjs/*` ni `@prisma/*`; controladores solo llaman casos de uso.
- [ ] Sin secretos, datos personales reales ni datos del CLENA no autorizados.
- [ ] Sin código comentado, `console.log` de depuración ni TODO sin Issue.

## Pruebas y calidad
- [ ] Pruebas unitarias para las reglas de dominio y los casos de uso nuevos.
- [ ] Prueba e2e si el cambio toca un endpoint.
- [ ] `lint`, `test`, `test:e2e` y `build` en verde en GitHub Actions.
- [ ] Cobertura global ≥ 70 % (obligatoria desde el Sprint 2).

## API e interfaz
- [ ] Endpoints nuevos documentados en Swagger (`/docs`) con ejemplos y códigos de respuesta.
- [ ] Errores en el formato uniforme.
- [ ] Pantallas públicas: usables con teclado, texto ≥ 16 px, contraste AA, se ven bien desde 360 px de ancho.

## Revisión y cierre
- [ ] PR con `Closes #<issue>` y `CLENA-<n>`, descripción, cómo probar y capturas si hay interfaz.
- [ ] Revisión con comentarios del compañero asignado por rotación.
- [ ] Aprobado y fusionado (squash merge) por Rafael Potes o, como alterno, Humberto Llinás; rama borrada.
- [ ] Issue cerrado y tarjeta en **Done** en GitHub Projects; work item en **Done** en Plane con comentario de evidencia (PR, validación).
- [ ] Documentación afectada actualizada (README, manuales, arquitectura).
