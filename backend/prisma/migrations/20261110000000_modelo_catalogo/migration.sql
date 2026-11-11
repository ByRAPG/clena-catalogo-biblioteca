-- Modelo de datos del catálogo (T-06).
--
-- Extensiones (ya creadas en la migración inicial; se repiten con IF NOT EXISTS
-- para que esta migración sea autosuficiente).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Decisión sobre unaccent():
-- unaccent() es STABLE, no IMMUTABLE, y PostgreSQL solo admite funciones
-- IMMUTABLE en índices de expresión. Por eso la búsqueda NO indexa
-- unaccent(title) directamente. Se usan columnas normalizadas (works.search_text,
-- authors.normalized_name, subjects.normalized_name) que mantiene la aplicación
-- con normalizeText (minúsculas, sin tildes), y los índices GIN gin_trgm_ops
-- se crean sobre esas columnas. La consulta normaliza el texto del usuario con
-- la misma función. Además se ofrece normalize_text(), un envoltorio IMMUTABLE
-- (diccionario fijado explícitamente, que es lo que lo hace seguro como
-- IMMUTABLE) para normalizar en SQL: consultas ad hoc, pruebas de paridad y
-- futuros índices de expresión.
CREATE OR REPLACE FUNCTION normalize_text(input text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT lower(public.unaccent('public.unaccent'::regdictionary, input)) $$;

-- CreateEnum
CREATE TYPE "role" AS ENUM ('ADMIN', 'STAFF', 'READER');

-- CreateEnum
CREATE TYPE "material_type" AS ENUM ('LIBRO', 'REVISTA', 'DOCUMENTO', 'MAPA', 'OTRO');

-- CreateEnum
CREATE TYPE "work_format" AS ENUM ('FISICO', 'DIGITAL', 'AMBOS');

-- CreateEnum
CREATE TYPE "copy_status" AS ENUM ('DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'BAJA');

-- CreateEnum
CREATE TYPE "reservation_status" AS ENUM ('ACTIVA', 'RECOGIDA', 'CANCELADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('POR_VENCER', 'VENCIDO');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "role" NOT NULL DEFAULT 'READER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failed_logins" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(3),
    "privacy_version" TEXT,
    "consent_at" TIMESTAMPTZ(3),
    "anonymized_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readers" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "full_name" TEXT NOT NULL,
    "document_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "privacy_version" TEXT,
    "consent_at" TIMESTAMPTZ(3),
    "anonymized_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "readers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "year" INTEGER,
    "publisher" TEXT,
    "isbn" TEXT,
    "classification" TEXT,
    "category_id" UUID,
    "material_type" "material_type" NOT NULL DEFAULT 'LIBRO',
    "format" "work_format" NOT NULL DEFAULT 'FISICO',
    "digital_url" TEXT,
    "search_text" TEXT NOT NULL DEFAULT '',
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_authors" (
    "work_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "work_authors_pkey" PRIMARY KEY ("work_id","author_id")
);

-- CreateTable
CREATE TABLE "work_subjects" (
    "work_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,

    CONSTRAINT "work_subjects_pkey" PRIMARY KEY ("work_id","subject_id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "map_svg" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelves" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "map_element_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shelves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copies" (
    "id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "shelf_id" UUID NOT NULL,
    "inventory_code" TEXT NOT NULL,
    "status" "copy_status" NOT NULL DEFAULT 'DISPONIBLE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "copy_id" UUID NOT NULL,
    "reader_id" UUID NOT NULL,
    "staff_id" UUID,
    "loaned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "returned_at" TIMESTAMPTZ(3),

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "copy_id" UUID NOT NULL,
    "reader_id" UUID NOT NULL,
    "status" "reservation_status" NOT NULL DEFAULT 'ACTIVA',
    "reserved_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "resolved_at" TIMESTAMPTZ(3),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "loan_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(3),
    "error" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_alerts" (
    "id" UUID NOT NULL,
    "reader_id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_at" TIMESTAMPTZ(3),

    CONSTRAINT "availability_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "file_name" TEXT NOT NULL,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "readers_user_id_key" ON "readers"("user_id");

-- CreateIndex
CREATE INDEX "readers_document_id_idx" ON "readers"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_normalized_name_key" ON "categories"("normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "works_isbn_key" ON "works"("isbn");

-- CreateIndex
CREATE INDEX "works_category_id_idx" ON "works"("category_id");

-- CreateIndex
CREATE INDEX "works_year_idx" ON "works"("year");

-- CreateIndex
CREATE INDEX "works_deleted_at_idx" ON "works"("deleted_at");

-- CreateIndex
CREATE INDEX "works_search_text_trgm_idx" ON "works" USING GIN ("search_text" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "authors_normalized_name_key" ON "authors"("normalized_name");

-- CreateIndex
CREATE INDEX "authors_normalized_name_trgm_idx" ON "authors" USING GIN ("normalized_name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "subjects_normalized_name_key" ON "subjects"("normalized_name");

-- CreateIndex
CREATE INDEX "subjects_normalized_name_trgm_idx" ON "subjects" USING GIN ("normalized_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "work_authors_author_id_idx" ON "work_authors"("author_id");

-- CreateIndex
CREATE INDEX "work_subjects_subject_id_idx" ON "work_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_key" ON "rooms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sections_room_id_name_key" ON "sections"("room_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "shelves_section_id_code_key" ON "shelves"("section_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "copies_inventory_code_key" ON "copies"("inventory_code");

-- CreateIndex
CREATE INDEX "copies_work_id_status_idx" ON "copies"("work_id", "status");

-- CreateIndex
CREATE INDEX "copies_shelf_id_idx" ON "copies"("shelf_id");

-- CreateIndex
CREATE INDEX "loans_copy_id_idx" ON "loans"("copy_id");

-- CreateIndex
CREATE INDEX "loans_reader_id_idx" ON "loans"("reader_id");

-- CreateIndex
CREATE INDEX "loans_staff_id_idx" ON "loans"("staff_id");

-- CreateIndex
CREATE INDEX "loans_due_at_idx" ON "loans"("due_at");

-- CreateIndex
CREATE INDEX "reservations_work_id_idx" ON "reservations"("work_id");

-- CreateIndex
CREATE INDEX "reservations_copy_id_idx" ON "reservations"("copy_id");

-- CreateIndex
CREATE INDEX "reservations_reader_id_idx" ON "reservations"("reader_id");

-- CreateIndex
CREATE INDEX "reservations_status_expires_at_idx" ON "reservations"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_loan_id_type_key" ON "notifications"("loan_id", "type");

-- CreateIndex
CREATE INDEX "availability_alerts_reader_id_idx" ON "availability_alerts"("reader_id");

-- CreateIndex
CREATE INDEX "availability_alerts_work_id_notified_at_idx" ON "availability_alerts"("work_id", "notified_at");

-- CreateIndex
CREATE INDEX "import_jobs_user_id_idx" ON "import_jobs"("user_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readers" ADD CONSTRAINT "readers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_authors" ADD CONSTRAINT "work_authors_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_authors" ADD CONSTRAINT "work_authors_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_subjects" ADD CONSTRAINT "work_subjects_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_subjects" ADD CONSTRAINT "work_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copies" ADD CONSTRAINT "copies_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copies" ADD CONSTRAINT "copies_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "shelves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_copy_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "copies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_reader_id_fkey" FOREIGN KEY ("reader_id") REFERENCES "readers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_copy_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "copies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_reader_id_fkey" FOREIGN KEY ("reader_id") REFERENCES "readers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_alerts" ADD CONSTRAINT "availability_alerts_reader_id_fkey" FOREIGN KEY ("reader_id") REFERENCES "readers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_alerts" ADD CONSTRAINT "availability_alerts_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;



-- Reglas que Prisma no puede expresar (índices únicos parciales)

-- Un ejemplar solo tiene un préstamo activo.
CREATE UNIQUE INDEX "loans_active_copy_key" ON "loans"("copy_id") WHERE "returned_at" IS NULL;

-- Un ejemplar solo tiene una reserva activa.
CREATE UNIQUE INDEX "reservations_active_copy_key" ON "reservations"("copy_id") WHERE "status" = 'ACTIVA';

-- Un lector solo tiene una solicitud «avísame» pendiente por obra.
CREATE UNIQUE INDEX "availability_alerts_pending_key" ON "availability_alerts"("reader_id", "work_id") WHERE "notified_at" IS NULL;

-- Integridad básica
ALTER TABLE "works" ADD CONSTRAINT "works_year_check" CHECK ("year" IS NULL OR "year" BETWEEN 0 AND 2100);
ALTER TABLE "loans" ADD CONSTRAINT "loans_dates_check" CHECK ("due_at" >= "loaned_at");
