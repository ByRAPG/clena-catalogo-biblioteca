/**
 * Una sola renovación en vuelo por carga de página.
 *
 * El refresh token es de un solo uso: el backend lo rota en cada
 * `POST /auth/refresh` y, si ve llegar dos veces el mismo, lo toma como reuso
 * y revoca la familia entera. Con `StrictMode` React monta, desmonta y vuelve
 * a montar el proveedor en desarrollo, así que el efecto corre dos veces y
 * saldrían dos peticiones con la misma cookie: una respondería 200 y la otra
 * 401, y la cookie nueva también quedaría revocada. En la práctica, un F5 en
 * `/gestion` con `docker compose up` dejaba a la persona sin sesión.
 *
 * La promesa vive en el módulo y no en el componente a propósito: la cookie es
 * una por navegador, así que «hay una renovación en curso» no es un dato de
 * una instancia de React sino de la página. Mientras la promesa esté pendiente
 * todos reciben la misma; cuando termina se olvida, para que una renovación
 * posterior vuelva a salir a la red.
 */
import { renovarSesionEnApi, type RespuestaDeSesion } from './sesion.api'

let enCurso: Promise<RespuestaDeSesion> | null = null

export function renovarSesionCompartida(): Promise<RespuestaDeSesion> {
  if (enCurso !== null) return enCurso

  const intento = renovarSesionEnApi().finally(() => {
    // Solo se olvida a sí misma: si alguien ya empezó otra, no se la borra.
    if (enCurso === intento) enCurso = null
  })
  enCurso = intento
  return intento
}

/**
 * Olvida la renovación en curso. Es para las pruebas: como el estado vive en
 * el módulo, una prueba que deja la petición sin responder se lo heredaría a
 * las siguientes del mismo archivo.
 */
export function olvidarRenovacionCompartida(): void {
  enCurso = null
}
