import { RoomNotFoundError } from '../domain/qr-destination';
import { GenerateEntranceQr } from './generate-entrance-qr.use-case';
import { GenerateRoomQr } from './generate-room-qr.use-case';
import { QrCodeGenerator } from './ports/qr-code.generator';
import { RoomRepository } from './ports/room.repository';

const ID = '3f2b8c1e-0000-4000-8000-000000000001';
const png = Buffer.from('png');

const fakeGenerator = (): QrCodeGenerator => ({
  toPng: jest.fn().mockResolvedValue(png),
});

describe('GenerateRoomQr', () => {
  it('genera el QR con la URL de la sala y nombre de archivo con slug', async () => {
    const rooms: RoomRepository = {
      findById: jest.fn().mockResolvedValue({ id: ID, name: 'Sala Caribe' }),
    };
    const generator = fakeGenerator();
    const result = await new GenerateRoomQr(
      rooms,
      generator,
      'https://clena.example/',
    ).execute(ID);
    expect(generator.toPng).toHaveBeenCalledWith(
      `https://clena.example/?sala=${ID}`,
    );
    expect(result).toEqual({ png, fileName: 'qr-sala-sala-caribe.png' });
  });

  it('lanza RoomNotFoundError si la sala no existe, sin generar', async () => {
    const rooms: RoomRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };
    const generator = fakeGenerator();
    await expect(
      new GenerateRoomQr(rooms, generator, 'http://x.test').execute(ID),
    ).rejects.toBeInstanceOf(RoomNotFoundError);
    expect(generator.toPng).not.toHaveBeenCalled();
  });
});

describe('GenerateEntranceQr', () => {
  it('genera el QR del buscador sin filtro', async () => {
    const generator = fakeGenerator();
    const result = await new GenerateEntranceQr(
      generator,
      'http://localhost:5173',
    ).execute();
    expect(generator.toPng).toHaveBeenCalledWith('http://localhost:5173/');
    expect(result).toEqual({ png, fileName: 'qr-entrada.png' });
  });

  it('falla si la URL pública es inválida', async () => {
    await expect(
      new GenerateEntranceQr(fakeGenerator(), 'nada').execute(),
    ).rejects.toThrow('PUBLIC_WEB_URL');
  });
});
