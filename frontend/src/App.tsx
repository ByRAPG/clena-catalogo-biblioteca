import { MantineProvider } from '@mantine/core'
import { BrowserRouter } from 'react-router-dom'
import { Rutas } from './app/rutas'
import { SesionProvider } from './features/auth/sesion-provider'
import { theme } from './shared/theme/theme'

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <SesionProvider>
        <BrowserRouter>
          <Rutas />
        </BrowserRouter>
      </SesionProvider>
    </MantineProvider>
  )
}

export default App
