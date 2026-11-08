import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Catálogo CLENA', () => {
  it('presenta el catálogo en el contenido principal', () => {
    const content = renderToStaticMarkup(<App />)

    expect(content).toMatch(/<main[^>]*>Catálogo CLENA<\/main>/)
  })
})
