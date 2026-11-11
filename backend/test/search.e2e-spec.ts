import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../src/app.setup';
import { SearchModule } from '../src/modules/search/search.module';
import { SharedModule } from '../src/shared/shared.module';

/**
 * e2e de búsqueda contra PostgreSQL real con la semilla aplicada.
 * Se omite si no hay E2E_DATABASE_URL (p. ej. en el CI, que no tiene base):
 *   E2E_DATABASE_URL=postgresql://postgres:tmp@localhost:55440/clena?schema=public pnpm run test:e2e
 */
const databaseUrl = process.env.E2E_DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

interface Summary {
  id: string;
  title: string;
  authors: string[];
  matchedOn: string | null;
  availability: { status: string; reason: string | null };
  location: unknown;
}

describeDb('Búsqueda (e2e, PostgreSQL real)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    const moduleRef = await Test.createTestingModule({
      imports: [SharedModule, SearchModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  const search = async (q: string): Promise<Summary[]> => {
    const res = await http()
      .get('/api/v1/search/works')
      .query({ q })
      .expect(200);
    return res.body.data as Summary[];
  };

  it.each([
    'cien años sole',
    'cien años soleda',
    'soledda',
    'SOLEDAD',
    'soledád',
  ])('«%s» devuelve Cien años de soledad entre los 3 primeros', async (q) => {
    const data = await search(q);
    expect(data.slice(0, 3).map((w) => w.title)).toContain(
      'Cien años de soledad',
    );
    expect(data[0].matchedOn).toBe('title');
  });

  it('«SOLEDAD» y «soledád» dan los mismos resultados', async () => {
    const a = (await search('SOLEDAD')).map((w) => w.id);
    const b = (await search('soledád')).map((w) => w.id);
    expect(a).toEqual(b);
  });

  it('«garcia marquez» devuelve sus obras con matchedOn author', async () => {
    const data = await search('garcia marquez');
    expect(data.length).toBeGreaterThan(0);
    for (const w of data) expect(w.matchedOn).toBe('author');
    // Las obras de García Márquez van antes que cualquier coincidencia aproximada.
    const esMarquez = data.map((w) => /Márquez/.test(w.authors.join(' ')));
    expect(esMarquez[0]).toBe(true);
    expect(esMarquez.join()).toBe([...esMarquez].sort().reverse().join());
  });

  it('«historia del caribe» devuelve obras por tema', async () => {
    const data = await search('historia del caribe');
    expect(data.length).toBeGreaterThan(0);
    expect(data.some((w) => w.matchedOn === 'subject')).toBe(true);
  });

  it('sin q: matchedOn null, paginación estable de 10 en 10 con total correcto', async () => {
    const p1 = await http().get('/api/v1/search/works').expect(200);
    const { total, page, pageSize } = p1.body.meta;
    expect({ page, pageSize }).toEqual({ page: 1, pageSize: 10 });
    expect(total).toBeGreaterThan(10);
    expect(p1.body.data).toHaveLength(10);
    expect(p1.body.data[0].matchedOn).toBeNull();

    const ids = new Set<string>(p1.body.data.map((w: Summary) => w.id));
    const titles = p1.body.data.map((w: Summary) => w.title);
    expect([...titles]).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    const pages = Math.ceil(total / 10);
    for (let n = 2; n <= pages; n++) {
      const res = await http()
        .get('/api/v1/search/works')
        .query({ page: n })
        .expect(200);
      expect(res.body.meta.total).toBe(total);
      for (const w of res.body.data as Summary[]) {
        expect(ids.has(w.id)).toBe(false);
        ids.add(w.id);
      }
    }
    expect(ids.size).toBe(total);
  });

  it('una página fuera de rango devuelve data vacío y el total real', async () => {
    const res = await http()
      .get('/api/v1/search/works')
      .query({ page: 9999 })
      .expect(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBeGreaterThan(10);
  });

  it('sin resultados responde 200 con data vacío', async () => {
    const res = await http()
      .get('/api/v1/search/works')
      .query({ q: 'zzzxqwv' })
      .expect(200);
    expect(res.body).toEqual({
      data: [],
      meta: { page: 1, pageSize: 10, total: 0 },
    });
  });

  it('available=true solo devuelve obras disponibles', async () => {
    const res = await http()
      .get('/api/v1/search/works')
      .query({ available: 'true', pageSize: 50 })
      .expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const w of res.body.data as Summary[]) {
      expect(w.availability.status).toBe('DISPONIBLE');
    }
    const all = await http().get('/api/v1/search/works').expect(200);
    expect(res.body.meta.total).toBeLessThan(all.body.meta.total);
  });

  it('filtra por categoría y por sala usando los ids de los listados', async () => {
    const cats = await http().get('/api/v1/search/categories').expect(200);
    const rooms = await http().get('/api/v1/search/rooms').expect(200);
    const names = (list: { name: string }[]) => list.map((c) => c.name);
    expect(names(cats.body.data)).toEqual(
      [...names(cats.body.data)].sort((a, b) => a.localeCompare(b)),
    );
    expect(cats.body.data.length).toBeGreaterThan(0);
    expect(rooms.body.data.length).toBeGreaterThan(0);

    const byCat = await http()
      .get('/api/v1/search/works')
      .query({ categoryId: cats.body.data[0].id, pageSize: 50 })
      .expect(200);
    expect(byCat.body.data.length).toBeGreaterThan(0);
    for (const w of byCat.body.data) {
      expect(w.category.id).toBe(cats.body.data[0].id);
    }

    const byRoom = await http()
      .get('/api/v1/search/works')
      .query({ roomId: rooms.body.data[0].id, pageSize: 50 })
      .expect(200);
    expect(byRoom.body.data.length).toBeGreaterThan(0);
    for (const w of byRoom.body.data) {
      expect(w.location.room).toBe(rooms.body.data[0].name);
    }
  });

  it('el detalle incluye ejemplares y no expone obras inexistentes', async () => {
    const [first] = await search('cien años de soledad');
    const res = await http()
      .get(`/api/v1/search/works/${first.id}`)
      .expect(200);
    expect(res.body).toMatchObject({
      id: first.id,
      title: 'Cien años de soledad',
      matchedOn: null,
    });
    expect(Array.isArray(res.body.copies)).toBe(true);
    for (const c of res.body.copies) {
      expect(['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO']).toContain(c.status);
      expect(c).toEqual(
        expect.objectContaining({
          inventoryCode: expect.any(String),
          room: expect.any(String),
          section: expect.any(String),
          shelf: expect.any(String),
        }),
      );
    }
    expect(res.body.availability.totalCopies).toBe(res.body.copies.length);

    await http()
      .get('/api/v1/search/works/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('parámetros inválidos dan 400 con el formato de error único', async () => {
    const bad: Record<string, string>[] = [
      { page: '0' },
      { pageSize: '51' },
      { pageSize: 'abc' },
      { categoryId: 'no-uuid' },
      { available: 'false' },
      { q: 'x'.repeat(101) },
    ];
    for (const query of bad) {
      const res = await http()
        .get('/api/v1/search/works')
        .query(query)
        .expect(400);
      expect(Object.keys(res.body).sort()).toEqual(
        ['error', 'message', 'path', 'statusCode', 'timestamp'].sort(),
      );
    }
    await http().get('/api/v1/search/works/no-es-uuid').expect(400);
  });

  it('no es vulnerable a inyección SQL en q', async () => {
    const res = await http()
      .get('/api/v1/search/works')
      .query({ q: "'; DROP TABLE works; --" })
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    await http().get('/api/v1/search/works').expect(200);
  });
});
