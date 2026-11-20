-- Persistencia de embeddings de obras (T-24, módulo search).
--
-- pgvector: la imagen de PostgreSQL debe incluir la extensión (en desarrollo
-- y CI, pgvector/pgvector:0.8.1-pg16).
CREATE EXTENSION IF NOT EXISTS vector;

-- Una fila por obra. El vector tiene 384 dimensiones (tamaño del modelo de
-- embeddings elegido); si cambia el modelo y las dimensiones, hace falta una
-- migración nueva. `model` guarda nombre y versión del modelo y `source_hash`
-- el SHA-256 del texto fuente, para detectar vectores obsoletos.
--
-- Sin índice aproximado (HNSW/IVFFlat): el catálogo es pequeño y la búsqueda
-- exacta por distancia coseno (<=>) da resultados reproducibles.
-- CreateTable
CREATE TABLE "work_embeddings" (
    "work_id" UUID NOT NULL,
    "embedding" vector(384) NOT NULL,
    "model" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_embeddings_pkey" PRIMARY KEY ("work_id")
);

-- AddForeignKey
ALTER TABLE "work_embeddings" ADD CONSTRAINT "work_embeddings_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;
