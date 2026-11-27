import {
  NoCopyAvailableError,
  ReservationAccountInvalidError,
  ReservationLimitReachedError,
  ReservationNotFoundError,
} from '../domain/reservation.errors';
import type {
  ReservationRecord,
  ReservationRepository,
} from '../domain/reservation.repository';
import { ReservationExpiryScheduler } from '../infrastructure/reservation-expiry.scheduler';
import {
  CancelReservation,
  ExpireReservations,
  ListMyReservations,
  ReserveWork,
} from './reservations.use-cases';

const NOW = new Date('2026-11-27T10:00:00Z');
const clock = { now: () => NOW };

function repo(overrides: Partial<ReservationRepository> = {}) {
  const base = {
    ensureReaderForUser: jest.fn(() => Promise.resolve('reader-1')),
    reserveAvailableCopy: jest.fn((input: { expiresAt: Date }) =>
      Promise.resolve({
        id: 'r1',
        expiresAt: input.expiresAt,
      } as ReservationRecord),
    ),
    listActiveByReader: jest.fn(() => Promise.resolve([])),
    cancel: jest.fn(() => Promise.resolve(true)),
    expireDue: jest.fn(() => Promise.resolve(0)),
  };
  return Object.assign(base, overrides) as typeof base & ReservationRepository;
}

describe('ReserveWork (HU-14)', () => {
  it('reserva con el plazo configurado y antes libera las vencidas', async () => {
    const r = repo();
    const useCase = new ReserveWork(r, clock, 48);
    const result = await useCase.execute({ userId: 'u1', workId: 'w1' });
    expect(r.expireDue).toHaveBeenCalledWith(NOW);
    expect(r.reserveAvailableCopy).toHaveBeenCalledWith({
      workId: 'w1',
      readerId: 'reader-1',
      reservedAt: NOW,
      expiresAt: new Date('2026-11-29T10:00:00Z'),
    });
    expect(result.expiresAt).toEqual(new Date('2026-11-29T10:00:00Z'));
  });

  it('propaga el error si no hay ejemplares disponibles', async () => {
    const r = repo({
      reserveAvailableCopy: jest.fn(() =>
        Promise.reject(new NoCopyAvailableError()),
      ),
    });
    await expect(
      new ReserveWork(r, clock, 48).execute({ userId: 'u1', workId: 'w1' }),
    ).rejects.toBeInstanceOf(NoCopyAvailableError);
  });
});

describe('cuentas eliminadas o inactivas y tope de reservas', () => {
  const invalida = () =>
    repo({
      ensureReaderForUser: jest.fn(() =>
        Promise.reject(new ReservationAccountInvalidError()),
      ),
    });

  it('reservar, listar y cancelar rechazan la cuenta no válida sin tocar reservas', async () => {
    const r = invalida();
    await expect(
      new ReserveWork(r, clock, 48).execute({ userId: 'u1', workId: 'w1' }),
    ).rejects.toBeInstanceOf(ReservationAccountInvalidError);
    await expect(
      new ListMyReservations(r, clock).execute('u1'),
    ).rejects.toBeInstanceOf(ReservationAccountInvalidError);
    await expect(
      new CancelReservation(r, clock).execute({
        userId: 'u1',
        reservationId: 'r1',
      }),
    ).rejects.toBeInstanceOf(ReservationAccountInvalidError);
    expect(r.reserveAvailableCopy).not.toHaveBeenCalled();
    expect(r.listActiveByReader).not.toHaveBeenCalled();
    expect(r.cancel).not.toHaveBeenCalled();
  });

  it('propaga el error del tope de reservas activas', async () => {
    const r = repo({
      reserveAvailableCopy: jest.fn(() =>
        Promise.reject(new ReservationLimitReachedError(3)),
      ),
    });
    await expect(
      new ReserveWork(r, clock, 48).execute({ userId: 'u1', workId: 'w1' }),
    ).rejects.toThrow('Tiene el máximo de 3 reservas activas');
  });
});

describe('ListMyReservations', () => {
  it('marca las vencidas antes de listar', async () => {
    const r = repo();
    await new ListMyReservations(r, clock).execute('u1');
    expect(r.expireDue).toHaveBeenCalledWith(NOW);
    expect(r.listActiveByReader).toHaveBeenCalledWith('reader-1');
  });
});

describe('CancelReservation', () => {
  it('cancela una reserva propia', async () => {
    const r = repo();
    await new CancelReservation(r, clock).execute({
      userId: 'u1',
      reservationId: 'r1',
    });
    expect(r.cancel).toHaveBeenCalledWith({
      reservationId: 'r1',
      readerId: 'reader-1',
      now: NOW,
    });
  });

  it('una reserva ajena o inexistente responde no encontrada', async () => {
    const r = repo({ cancel: jest.fn(() => Promise.resolve(false)) });
    await expect(
      new CancelReservation(r, clock).execute({
        userId: 'u1',
        reservationId: 'x',
      }),
    ).rejects.toBeInstanceOf(ReservationNotFoundError);
  });
});

describe('ReservationExpiryScheduler', () => {
  const config = (seconds: unknown) =>
    ({ get: () => seconds }) as unknown as ConstructorParameters<
      typeof ReservationExpiryScheduler
    >[1];

  it('no programa nada con intervalo 0 o sin definir', () => {
    const useCase = new ExpireReservations(repo(), clock);
    for (const value of [0, undefined]) {
      const scheduler = new ReservationExpiryScheduler(useCase, config(value));
      scheduler.onApplicationBootstrap();
      expect(
        (scheduler as unknown as { timer?: unknown }).timer,
      ).toBeUndefined();
    }
  });

  it('un fallo del caso de uso no lanza excepción', async () => {
    const r = repo({
      expireDue: jest.fn(() => Promise.reject(new Error('db caída'))),
    });
    const scheduler = new ReservationExpiryScheduler(
      new ExpireReservations(r, clock),
      config(60),
    );
    await expect(scheduler.run()).resolves.toBeUndefined();
  });

  it('programa y cancela el intervalo', () => {
    const scheduler = new ReservationExpiryScheduler(
      new ExpireReservations(repo(), clock),
      config(60),
    );
    scheduler.onApplicationBootstrap();
    expect((scheduler as unknown as { timer?: unknown }).timer).toBeDefined();
    scheduler.onModuleDestroy();
    expect((scheduler as unknown as { timer?: unknown }).timer).toBeUndefined();
  });
});
