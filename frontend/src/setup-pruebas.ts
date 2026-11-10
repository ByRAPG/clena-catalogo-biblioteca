/**
 * Preparación del entorno de pruebas. jsdom no implementa `matchMedia` ni
 * `ResizeObserver`, y Mantine los usa para el esquema de color y los
 * componentes que miden su contenedor.
 */
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Sin `globals: true`, la limpieza del DOM entre pruebas hay que pedirla.
afterEach(cleanup)

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (consulta: string) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})

class ObservadorDeTamano {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ObservadorDeTamano as unknown as typeof ResizeObserver
