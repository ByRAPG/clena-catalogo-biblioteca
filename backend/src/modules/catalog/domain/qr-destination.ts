/** Ruta pública del buscador en el frontend (índice de `rutas.tsx`). */
export const SEARCH_PAGE_PATH = '/';
/** Parámetro de la URL del frontend que filtra por sala. */
export const ROOM_QUERY_PARAM = 'sala';

export class InvalidPublicWebUrlError extends Error {
  constructor(value: string) {
    super(
      `PUBLIC_WEB_URL no es una URL http(s) válida: «${value}». Ejemplo: http://localhost:5173`,
    );
    this.name = 'InvalidPublicWebUrlError';
  }
}

export class RoomNotFoundError extends Error {
  constructor(id: string) {
    super(`No existe la sala ${id}`);
    this.name = 'RoomNotFoundError';
  }
}

function parseBaseUrl(publicWebUrl: string): URL {
  let url: URL;
  try {
    url = new URL(publicWebUrl.trim());
  } catch {
    throw new InvalidPublicWebUrlError(publicWebUrl);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new InvalidPublicWebUrlError(publicWebUrl);
  }
  return url;
}

/** URL a la que lleva el QR de entrada: el buscador sin filtro. */
export function buildEntranceUrl(publicWebUrl: string): string {
  const base = parseBaseUrl(publicWebUrl);
  const prefix = base.pathname.replace(/\/+$/, '');
  return `${base.origin}${prefix}${SEARCH_PAGE_PATH}`;
}

/** URL a la que lleva el QR de una sala: el buscador con esa sala filtrada. */
export function buildRoomUrl(publicWebUrl: string, roomId: string): string {
  return `${buildEntranceUrl(publicWebUrl)}?${ROOM_QUERY_PARAM}=${encodeURIComponent(roomId)}`;
}

/** Convierte un nombre en un fragmento seguro para nombres de archivo. */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'sala';
}
