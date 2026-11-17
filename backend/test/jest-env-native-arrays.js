// Entorno de Jest para la prueba con el modelo real: ONNX Runtime exige los
// TypedArray del contexto principal, no los del sandbox de Jest.
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class NativeArraysEnvironment extends NodeEnvironment {
  constructor(...args) {
    super(...args);
    for (const name of [
      'Float32Array',
      'Int32Array',
      'Uint8Array',
      'BigInt64Array',
      'ArrayBuffer',
    ]) {
      this.global[name] = globalThis[name];
    }
  }
}

module.exports = NativeArraysEnvironment;
