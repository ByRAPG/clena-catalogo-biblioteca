-- Extensiones para la búsqueda tolerante (ADR-02)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateTable
CREATE TABLE "schema_info" (
    "id" SERIAL NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schema_info_pkey" PRIMARY KEY ("id")
);