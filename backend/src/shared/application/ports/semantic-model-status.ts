import { SemanticModelStatus } from '../../domain/health-report';

export const SEMANTIC_MODEL_STATUS = Symbol('SEMANTIC_MODEL_STATUS');

/** Estado del modelo de embeddings; lo publica el módulo `search`. */
export interface SemanticModelStatusProvider {
  current(): SemanticModelStatus;
}
