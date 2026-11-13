import { conParametros, peticion } from '../../shared/api/client'

/** Cuerpo de `POST /catalog/works` (HU-10). */
export interface DatosObraNueva {
  title: string
  authors: string[]
  subjects: string[]
  categoryId?: string
  year?: number
}

export interface ObraRegistrada {
  id: string
  title: string
}

export interface TerminoCatalogo {
  id: string
  name: string
}

export type TipoDeTermino = 'authors' | 'subjects'

export function registrarObra(datos: DatosObraNueva, token: string) {
  return peticion<ObraRegistrada>('/catalog/works', {
    metodo: 'POST',
    cuerpo: datos,
    token,
  })
}

/** Autores o temas que ya existen y contienen `texto`. */
export async function sugerirTerminos(
  tipo: TipoDeTermino,
  texto: string,
  token: string,
  signal?: AbortSignal,
): Promise<TerminoCatalogo[]> {
  const respuesta = await peticion<{ data: TerminoCatalogo[] }>(
    conParametros(`/catalog/${tipo}`, { q: texto }),
    { token, signal },
  )
  return respuesta.data
}
