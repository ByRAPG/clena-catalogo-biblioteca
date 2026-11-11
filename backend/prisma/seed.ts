import { createHash } from 'node:crypto';

import { CopyStatus, PrismaClient, Role, WorkFormat } from '@prisma/client';
import { hash } from 'argon2';

import { normalizeText } from '../src/shared/domain/normalize-text';
import { LIBROS, UBICACIONES, isbnFicticio } from './data/catalogo';

const prisma = new PrismaClient();

const AVISO_PRIVACIDAD = 'v1-demo';

const ESTADOS_CICLO: CopyStatus[] = [
  CopyStatus.DISPONIBLE,
  CopyStatus.DISPONIBLE,
  CopyStatus.PRESTADO,
  CopyStatus.DISPONIBLE,
  CopyStatus.MANTENIMIENTO,
  CopyStatus.DISPONIBLE,
  CopyStatus.PRESTADO,
  CopyStatus.BAJA,
];

/** UUID determinista a partir de una clave: permite upsert idempotente sin clave natural. */
function uuidDeterminista(clave: string): string {
  const h = createHash('sha1').update(`clena-seed:${clave}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * Clave estable para ids y URLs. Va aparte de normalizeText para que los ids
 * de la semilla no cambien si esa función evoluciona.
 */
function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function sembrarUsuarios(): Promise<void> {
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password) {
    throw new Error(
      'Falta SEED_DEMO_PASSWORD. Define la contraseña de demostración en el entorno (ver .env.example).',
    );
  }
  const passwordHash = await hash(password);
  const usuarios = [
    {
      email: 'admin@example.org',
      fullName: 'Administrador de Demostración',
      role: Role.ADMIN,
    },
    {
      email: 'personal@example.org',
      fullName: 'Bibliotecaria de Demostración',
      role: Role.STAFF,
    },
    {
      email: 'lector@example.org',
      fullName: 'Lector de Demostración',
      role: Role.READER,
    },
  ];
  for (const u of usuarios) {
    const consentimiento =
      u.role === Role.READER
        ? {
            privacyVersion: AVISO_PRIVACIDAD,
            consentAt: new Date('2026-11-01T00:00:00Z'),
          }
        : {};
    // update vacío: no se pisan cambios hechos a mano ni se reescribe el hash.
    const usuario = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash, ...consentimiento },
    });
    if (u.role === Role.READER) {
      await prisma.reader.upsert({
        where: { userId: usuario.id },
        update: {},
        create: {
          userId: usuario.id,
          fullName: u.fullName,
          email: u.email,
          ...consentimiento,
        },
      });
    }
  }
}

async function sembrarUbicaciones(): Promise<Map<string, string>> {
  const estantes = new Map<string, string>();
  for (const ub of UBICACIONES) {
    const sala = await prisma.room.upsert({
      where: { name: ub.sala },
      update: {},
      create: { name: ub.sala },
    });
    const seccion = await prisma.section.upsert({
      where: { roomId_name: { roomId: sala.id, name: ub.seccion } },
      update: {},
      create: { roomId: sala.id, name: ub.seccion },
    });
    for (const code of ub.estantes) {
      const estante = await prisma.shelf.upsert({
        where: { sectionId_code: { sectionId: seccion.id, code } },
        update: {},
        create: { sectionId: seccion.id, code },
      });
      estantes.set(code, estante.id);
    }
  }
  return estantes;
}

async function sembrarCatalogo(estantes: Map<string, string>): Promise<void> {
  const categorias = new Map<string, string>();
  const autores = new Map<string, string>();
  const temas = new Map<string, string>();

  for (const [indice, libro] of LIBROS.entries()) {
    let categoriaId = categorias.get(libro.categoria);
    if (!categoriaId) {
      const categoria = await prisma.category.upsert({
        where: { normalizedName: normalizeText(libro.categoria) },
        update: {},
        create: {
          name: libro.categoria,
          normalizedName: normalizeText(libro.categoria),
        },
      });
      categoriaId = categoria.id;
      categorias.set(libro.categoria, categoriaId);
    }

    const id = uuidDeterminista(`obra:${slug(libro.titulo)}:${libro.anio}`);
    const digital = indice % 5 === 0;
    const datos = {
      title: libro.titulo,
      year: libro.anio,
      publisher: libro.editorial,
      isbn: libro.real ? null : isbnFicticio(100 + indice),
      classification: libro.clasificacion ?? null,
      categoryId: categoriaId,
      format: digital ? WorkFormat.AMBOS : WorkFormat.FISICO,
      digitalUrl: digital
        ? `https://example.org/biblioteca-digital/${slug(libro.titulo)}`
        : null,
      searchText: normalizeText(libro.titulo),
    };
    await prisma.work.upsert({
      where: { id },
      update: datos,
      create: { id, ...datos },
    });

    for (const [posicion, nombre] of libro.autores.entries()) {
      const clave = normalizeText(nombre);
      let autorId = autores.get(clave);
      if (!autorId) {
        const autor = await prisma.author.upsert({
          where: { normalizedName: clave },
          update: {},
          create: { name: nombre, normalizedName: clave },
        });
        autorId = autor.id;
        autores.set(clave, autorId);
      }
      await prisma.workAuthor.upsert({
        where: { workId_authorId: { workId: id, authorId: autorId } },
        update: { position: posicion },
        create: { workId: id, authorId: autorId, position: posicion },
      });
    }

    for (const nombre of libro.temas) {
      const clave = normalizeText(nombre);
      let temaId = temas.get(clave);
      if (!temaId) {
        const tema = await prisma.subject.upsert({
          where: { normalizedName: clave },
          update: {},
          create: { name: nombre, normalizedName: clave },
        });
        temaId = tema.id;
        temas.set(clave, temaId);
      }
      await prisma.workSubject.upsert({
        where: { workId_subjectId: { workId: id, subjectId: temaId } },
        update: {},
        create: { workId: id, subjectId: temaId },
      });
    }

    const shelfId = estantes.get(libro.estante);
    if (!shelfId)
      throw new Error(`Estante inexistente en la semilla: ${libro.estante}`);
    const ejemplares = 1 + (indice % 3);
    for (let n = 0; n < ejemplares; n++) {
      const inventoryCode = `CLENA-${String(indice + 1).padStart(4, '0')}-${n + 1}`;
      const status = ESTADOS_CICLO[(indice + n) % ESTADOS_CICLO.length];
      await prisma.copy.upsert({
        where: { inventoryCode },
        update: {},
        create: { inventoryCode, workId: id, shelfId, status },
      });
    }
  }
}

async function seed(): Promise<void> {
  await prisma.schemaInfo.upsert({
    where: { id: -1 },
    update: {},
    create: {
      id: -1,
      note: 'Registro ficticio de desarrollo',
    },
  });
  await sembrarUsuarios();
  const estantes = await sembrarUbicaciones();
  await sembrarCatalogo(estantes);
  console.log(
    `Semilla lista: ${LIBROS.length} obras, ${estantes.size} estantes, 3 usuarios.`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
