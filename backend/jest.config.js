/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  coverageDirectory: '../coverage',
  // Regla del proyecto: se mide la lógica de negocio (domain y application de cada módulo).
  collectCoverageFrom: [
    '**/domain/**/*.ts',
    '**/application/**/*.ts',
    '!**/*.spec.ts',
    // Puertos: solo interfaces y símbolos de inyección, sin lógica que ejecutar.
    '!**/application/ports/**',
    // Tokens de inyección (Symbol): constantes sin lógica.
    '!**/application/tokens.ts',
    // Barriles de reexportación: sin lógica.
    '!**/index.ts',
  ],
  // Medido el 16 nov 2026: sentencias 99 %, ramas 98 %, funciones 100 %, líneas 99 %.
  // Piso de la regla (70 %) en líneas, funciones y sentencias; ramas 80 % para detectar casos de error sin probar.
  // Si baja de aquí, jest termina con código distinto de cero y el CI falla.
  coverageThreshold: {
    global: { lines: 70, statements: 70, functions: 70, branches: 80 },
  },
};