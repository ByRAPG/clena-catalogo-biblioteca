import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { renovarSesionCompartida } from './renovacion-compartida'
import {
  cerrarSesionEnApi,
  iniciarSesionEnApi,
  type RespuestaDeSesion,
} from './sesion.api'
import { ApiError } from '../../shared/api/client'
import { SesionContext, type Sesion } from './sesion-context'
import { esperaHastaRenovar } from './vencimiento-token'

const REINTENTOS_MAXIMOS = 3
const ESPERA_REINTENTO_MS = 5_000

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
 *
 * Con la sesión abierta, el access token se renueva solo un minuto antes de
 * vencer (y al volver a la pestaña, si el navegador durmió el temporizador).
 * Si la renovación es rechazada (401 o 403), la sesión se cierra en este navegador y las rutas
 * protegidas llevan a «Ingresar».
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
    // Sin `AbortController`: el refresh token es de un solo uso, así que una
    // petición abortada a medias igual pudo llegar al backend y gastar la
    // cookie. La deduplicación la hace `renovarSesionCompartida`, que con
    // `StrictMode` devuelve la misma promesa a los dos montajes.
    let activo = true

    renovarSesionCompartida()
      .then((respuesta) => {
        if (!activo) return
        setSesion(aSesion(respuesta))
        setIntentoHecho(true)
      })
      .catch(() => {
        // Sin cookie válida no hay sesión que recuperar: es lo esperado para
        // quien solo viene a consultar el catálogo.
        if (!activo) return
        setIntentoHecho(true)
      })

    return () => {
      activo = false
    }
  }, [])

  const token = sesion?.token ?? null

  useEffect(() => {
    if (token === null) return
    let activo = true

    let reintentos = 0
    let temporizadorReintento: number | undefined

    const renovar = () => {
      renovarSesionCompartida()
        .then((respuesta) => {
          if (activo) setSesion(aSesion(respuesta))
        })
        .catch((causa: unknown) => {
          if (!activo) return
          // Solo un 401 o 403 indica cookie vencida o revocada. Un corte de
          // red o un 5xx puntual no deben sacar a la persona de su trabajo:
          // se reintenta unas pocas veces antes de rendirse.
          const rechazada =
            causa instanceof ApiError &&
            (causa.statusCode === 401 || causa.statusCode === 403)
          if (rechazada || reintentos >= REINTENTOS_MAXIMOS) {
            setSesion(null)
            return
          }
          reintentos += 1
          temporizadorReintento = window.setTimeout(renovar, ESPERA_REINTENTO_MS)
        })
    }

    const temporizador = window.setTimeout(
      renovar,
      esperaHastaRenovar(token, Date.now()),
    )

    // Con la pestaña en segundo plano o el equipo suspendido, el navegador
    // puede retrasar el temporizador: al volver se comprueba si ya toca.
    const alVolver = () => {
      if (
        document.visibilityState === 'visible' &&
        esperaHastaRenovar(token, Date.now()) <= 5_000
      ) {
        window.clearTimeout(temporizador)
        renovar()
      }
    }
    document.addEventListener('visibilitychange', alVolver)

    return () => {
      activo = false
      window.clearTimeout(temporizador)
      window.clearTimeout(temporizadorReintento)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [token])

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
