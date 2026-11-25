import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { theme } from '../../shared/theme/theme'
import {
  PaginaPrivacidad,
  TEXTO_CONSENTIMIENTO,
  VERSION_AVISO_PRIVACIDAD,
} from './pagina-privacidad'

function pintar() {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="light">
      <PaginaPrivacidad />
    </MantineProvider>,
  )
}

describe('PaginaPrivacidad', () => {
  it('muestra el título principal, la versión vigente y la advertencia provisional', () => {
    pintar()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Aviso de privacidad' }),
    ).toBeDefined()
    expect(
      screen.getByText(new RegExp(`Versión ${VERSION_AVISO_PRIVACIDAD}`)),
    ).toBeDefined()
    expect(screen.getByText(/Prototipo académico/)).toBeDefined()
    expect(
      screen.getByText(/Las demostraciones utilizan datos ficticios/),
    ).toBeDefined()
  })

  it('detalla las finalidades, datos mínimos y la búsqueda semántica local sin terceros', () => {
    pintar()

    expect(
      screen.getByRole('heading', { level: 2, name: 'Finalidades y datos mínimos' }),
    ).toBeDefined()
    expect(
      screen.getByText(/consulta pública del catálogo no requiere crear una cuenta/i),
    ).toBeDefined()
    expect(
      screen.getByText(/modelo de embeddings de código abierto que corre en el propio servidor/i),
    ).toBeDefined()
    expect(
      screen.getByText(/no se envían a servicios externos de inteligencia artificial ni a terceros/i),
    ).toBeDefined()
  })

  it('incluye derechos de la Ley 1581, texto de consentimiento y enlace normativo', () => {
    pintar()

    expect(
      screen.getByRole('heading', { level: 2, name: 'Sus derechos' }),
    ).toBeDefined()
    expect(screen.getByText(TEXTO_CONSENTIMIENTO)).toBeDefined()
    expect(
      screen.getByText(/Leer esta página no registra consentimiento/),
    ).toBeDefined()

    const enlace = screen.getByRole('link', {
      name: 'Consultar la Ley 1581 de 2012',
    })
    expect(enlace.getAttribute('href')).toBe(
      'https://normograma.dian.gov.co/dian/compilacion/docs/ley_1581_2012.htm',
    )
    expect(enlace.getAttribute('target')).toBe('_blank')
    expect(enlace.getAttribute('rel')).toBe('noreferrer')
  })

  it('aclara la adopción de licencia MIT sin confirmación del CLENA ni del docente', () => {
    pintar()

    expect(
      screen.getByRole('heading', { level: 2, name: 'Licencia del código' }),
    ).toBeDefined()
    expect(
      screen.getByText(
        /licencia MIT por decisión del equipo, sin confirmación formal del CLENA ni del docente/i,
      ),
    ).toBeDefined()
    expect(
      screen.getByText(/no cubre datos reales, catálogos, logotipos ni archivos digitales de terceros/i),
    ).toBeDefined()
  })
})
