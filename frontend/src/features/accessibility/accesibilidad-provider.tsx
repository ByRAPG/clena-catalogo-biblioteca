import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AccesibilidadContext } from './preferencias-context'
import {
  aplicarPreferencias,
  guardarPreferencias,
  leerPreferencias,
  type Preferencias,
} from './preferencias'

export function AccesibilidadProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] =
    useState<Preferencias>(leerPreferencias)

  useEffect(() => {
    aplicarPreferencias(preferencias)
  }, [preferencias])

  const cambiar = useCallback((cambio: Partial<Preferencias>) => {
    setPreferencias((actual) => {
      const nueva = { ...actual, ...cambio }
      guardarPreferencias(nueva)
      return nueva
    })
  }, [])

  const valor = useMemo(
    () => ({
      preferencias,
      alternarLetraGrande: () =>
        cambiar({ letraGrande: !preferencias.letraGrande }),
      alternarAltoContraste: () =>
        cambiar({ altoContraste: !preferencias.altoContraste }),
    }),
    [preferencias, cambiar],
  )

  return (
    <AccesibilidadContext.Provider value={valor}>
      {children}
    </AccesibilidadContext.Provider>
  )
}
