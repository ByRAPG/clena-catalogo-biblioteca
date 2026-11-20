# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Cambiar el concepto de logo

1. El concepto vigente es la constante `CONCEPTO_LOGO` de `src/shared/ui/logo-concepto.ts` (`a`, `b`, `c` o `bf`).
2. Comando: `node scripts/aplicar-logo.mjs b` (sin dependencias) actualiza la constante y copia el símbolo del concepto a `public/favicon.svg`.
3. Los PNG (`favicon-32`, `apple-touch-icon`, `icon-192`, `icon-512`) se regeneran con Chrome o Edge sin interfaz si hay uno instalado; si no, quedan como están y el script avisa.
4. Los dibujos de los cuatro conceptos están en `public/logos-alt/` (`busca-<c>.svg`, `-oscuro`, `-mini`).
5. Después, `pnpm test` y `pnpm build`.

### Concepto C: compacto «BF» y esquema de color

- En el concepto C la versión compacta (cabecera móvil, favicon, iconos) es el monograma «BF», con las letras B y F del logotipo; `public/logos-alt/busca-c-mini.svg` es el icono (BF ámbar sobre marino).
- El esquema de color es la constante `ESQUEMA_LOGO` (`1`, `2` o `3`) de `src/shared/ui/logo-concepto.ts`: 1 texto blanco y lupa ámbar; 2 texto amarillo CLENA y lupa blanca; 3 placa ámbar con texto marino y lupa granate. Los colores son las variables `--logo-texto`, `--logo-lupa` y `--logo-placa` de `src/shared/ui/logo.css` (con sus contrastes).
