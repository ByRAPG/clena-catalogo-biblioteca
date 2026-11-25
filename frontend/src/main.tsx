import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-500.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-700.css'
import './app/fuentes.css'
import '@mantine/core/styles.css'
import './index.css'
import './app/estilos-marca.css'
import './app/alto-contraste.css'
import App from './App.tsx'
import { aplicarEsquemaLogo } from './shared/ui/logo-esquema'
import { iniciarEntrada } from './shared/efectos/entrada-portada'
import { iniciarBrilloSincronizado } from './shared/efectos/brillo-sincronizado'
import { prepararRevelado } from './shared/efectos/revelar'

aplicarEsquemaLogo()
iniciarEntrada()
prepararRevelado()
iniciarBrilloSincronizado()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
