import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
  EMBEDDING_GENERATOR,
  EmbeddingGenerator,
} from '../application/ports/embedding-generator';

/**
 * Lanza la carga del modelo en segundo plano al arrancar. No espera: el
 * arranque y `/health` no se bloquean; el estado se lee con `status()`.
 */
@Injectable()
export class EmbeddingModelWarmup implements OnApplicationBootstrap {
  constructor(
    @Inject(EMBEDDING_GENERATOR) private readonly generator: EmbeddingGenerator,
  ) {}

  onApplicationBootstrap(): void {
    void this.generator.warmUp?.();
  }
}
