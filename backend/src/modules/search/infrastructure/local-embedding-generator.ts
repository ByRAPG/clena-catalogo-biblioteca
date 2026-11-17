import { Logger } from '@nestjs/common';
import {
  EmbeddingGenerator,
  EmbeddingGeneratorStatus,
} from '../application/ports/embedding-generator';
import { EMBEDDING_DIMENSIONS, EmbeddingVector } from '../domain/embedding';

/** Identificador del modelo dentro de `EMBEDDING_MODEL_PATH`. */
export const LOCAL_MODEL_ID = 'Xenova/multilingual-e5-small';
export const LOCAL_MODEL_NAME = 'multilingual-e5-small-q8';
export const QUERY_PREFIX = 'query: ';
export const PASSAGE_PREFIX = 'passage: ';
/** Pasajes por llamada al modelo: acota la memoria del lote. */
const MAX_BATCH = 16;

/** Tensor de salida de la librería; solo se usa `tolist()`. */
export interface EmbeddingTensor {
  tolist(): number[][];
}

export type FeatureExtractor = (
  texts: string[],
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<EmbeddingTensor>;

/** Parte de `@huggingface/transformers` que usa el adaptador (inyectable en pruebas). */
export interface TransformersLibrary {
  env: {
    allowRemoteModels: boolean;
    allowLocalModels: boolean;
    localModelPath: string;
    useFSCache: boolean;
    useBrowserCache: boolean;
  };
  pipeline(
    task: 'feature-extraction',
    model: string,
    options: {
      dtype: 'q8';
      local_files_only: boolean;
      session_options: { intraOpNumThreads: number };
    },
  ): Promise<FeatureExtractor>;
}

export interface LocalEmbeddingOptions {
  /** Carpeta con `Xenova/multilingual-e5-small/...`; nunca se descarga nada. */
  modelPath: string;
  /** Hilos de ONNX Runtime; sin fijarlos la consulta es ~18 veces más lenta en contenedores. */
  intraOpNumThreads: number;
  /** Carga la librería; por defecto la importa de forma diferida. */
  loadLibrary?: () => Promise<TransformersLibrary>;
}

const defaultLoadLibrary = async (): Promise<TransformersLibrary> =>
  (await import('@huggingface/transformers')) as unknown as TransformersLibrary;

/**
 * Adaptador local de multilingual-e5-small (q8) con `@huggingface/transformers`.
 * Pone los prefijos `query: ` y `passage: `, aplica mean pooling y normaliza a
 * norma 1 (384 dimensiones). La carga es diferida y en segundo plano
 * (`warmUp`): hasta que termina `status().state` es `loading`, y si falla
 * queda en `error` sin tumbar la API.
 */
export class LocalEmbeddingGenerator implements EmbeddingGenerator {
  private readonly logger = new Logger(LocalEmbeddingGenerator.name);
  private state: EmbeddingGeneratorStatus['state'] = 'loading';
  private loading: Promise<FeatureExtractor> | undefined;
  private extractor: FeatureExtractor | undefined;

  constructor(private readonly options: LocalEmbeddingOptions) {}

  /** Inicia la carga (una sola vez) y resuelve cuando termina; nunca rechaza. */
  async warmUp(): Promise<void> {
    try {
      await this.load();
    } catch {
      // El error ya quedó registrado y en `status()`.
    }
  }

  async embedQuery(text: string): Promise<EmbeddingVector> {
    const [vector] = await this.embed([QUERY_PREFIX + text]);
    return vector;
  }

  async embedPassages(texts: string[]): Promise<EmbeddingVector[]> {
    const prefixed = texts.map((text) => PASSAGE_PREFIX + text);
    const vectors: EmbeddingVector[] = [];
    for (let i = 0; i < prefixed.length; i += MAX_BATCH) {
      vectors.push(...(await this.embed(prefixed.slice(i, i + MAX_BATCH))));
    }
    return vectors;
  }

  status(): EmbeddingGeneratorStatus {
    return {
      state: this.state,
      model: LOCAL_MODEL_NAME,
      dimensions: EMBEDDING_DIMENSIONS,
    };
  }

  private async embed(texts: string[]): Promise<EmbeddingVector[]> {
    const extractor = this.extractor ?? (await this.load());
    const output = await extractor(texts, { pooling: 'mean', normalize: true });
    return output.tolist();
  }

  private load(): Promise<FeatureExtractor> {
    this.loading ??= this.doLoad();
    return this.loading;
  }

  private async doLoad(): Promise<FeatureExtractor> {
    const startedAt = Date.now();
    try {
      const library = await (this.options.loadLibrary ?? defaultLoadLibrary)();
      // Sin red y sin caché escribible: el modelo viene dentro de la imagen.
      library.env.allowRemoteModels = false;
      library.env.allowLocalModels = true;
      library.env.localModelPath = this.options.modelPath;
      library.env.useFSCache = false;
      library.env.useBrowserCache = false;
      this.extractor = await library.pipeline(
        'feature-extraction',
        LOCAL_MODEL_ID,
        {
          dtype: 'q8',
          local_files_only: true,
          session_options: {
            intraOpNumThreads: this.options.intraOpNumThreads,
          },
        },
      );
      this.state = 'ready';
      this.logger.log(`Modelo cargado en ${Date.now() - startedAt} ms`);
      return this.extractor;
    } catch (error) {
      this.state = 'error';
      this.logger.error(
        `No se pudo cargar el modelo: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
