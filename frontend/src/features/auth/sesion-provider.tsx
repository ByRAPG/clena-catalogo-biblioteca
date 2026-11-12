import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  cerrarSesionEnApi,
  iniciarSesionEnApi,
  renovarSesionEnApi,
  type RespuestaDeSesion,
} from './sesion.api'
import { SesionContext, type Sesion } from './sesion-context'

/**
 * Sesión del personal según el ADR-03.
 *
 * El access token vive **solo en el estado de React**. Antes se guardaba la
 * sesión entera en `sessionStorage`, lo que dejaba el JWT al alcance de
 * cualquier script de la página; ahora desaparece con el recargado y lo que
 * persiste es la cookie `httpOnly` del refresh token, que el JavaScript de la
 * página no puede leer.
 *
 * Al montar se intenta `POST /auth/refresh` una vez: si hay cookie válida, la
 * sesión se recupera sin que la persona vuelva a escribir la contraseña; si no
 * la hay, el 401 es la respuesta normal para un visitante del catálogo y no se
 * muestra como error.
 */
function aSesion(respuesta: RespuestaDeSesion): Sesion {
  return {
    token: respuesta.accessToken,
    nombre: respuesta.usuario.nombre,
    rol: respuesta.usuario.rol,
  }
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  // Pasa a `true` cuando el intento inicial de renovación termina, haya o no
  // sesión. Se guarda el resultado del intento, no un «cargando» que habría
  // que encender de forma síncrona dentro del efecto.
  const [intentoHecho, setIntentoHecho] = useState(false)

  useEffect(() => {
    const controlador = new AbortController()

    renovarSesionEnApi(controlador.signal)
      .then((respuesta) => {
        if (controlador.signal.aborted) return
        setSesion(aSesion(respuesta))
        setIntentoHecho(true)
      })
      .catch(() => {
        // Sin cookie válida no hay sesión que recuperar: es lo esperado para
        // quien solo viene a consultar el catálogo.
        if (controlador.signal.aborted) return
        setIntentoHecho(true)
      })

    return () => controlador.abort()
  }, [])

  const iniciarSesion = useCallback(
    async (correo: string, contrasena: string) => {
      const respuesta = await iniciarSesionEnApi(correo, contrasena)
      setSesion(aSesion(respuesta))
      setIntentoHecho(true)
    },
    [],
  )

  const cerrarSesion = useCallback(async () => {
    try {
      await cerrarSesionEnApi()
    } finally {
      // Aunque la llamada falle, en este navegador la sesión se cierra: es
      // más seguro quedarse fuera que seguir dentro con un token en memoria.
      setSesion(null)
      setIntentoHecho(true)
    }
  }, [])

  const valor = useMemo(
    () => ({
      sesion,
      recuperando: !intentoHecho,
      iniciarSesion,
      cerrarSesion,
    }),
    [sesion, intentoHecho, iniciarSesion, cerrarSesion],
  )

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}
