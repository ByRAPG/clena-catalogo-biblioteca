import {
  AlertWorkNotFoundError,
  ReaderNotFoundError,
  ReaderWithoutEmailError,
  WorkAlreadyAvailableError,
} from '../../domain/errors/loan.errors';
import type { EmailSender } from '../ports/email-sender.port';
import type {
  DueLoan,
  LoanAlertsRepository,
  PendingAvailabilityAlert,
} from '../ports/loan-alerts.repository';
import { ListLoanAlertsUseCase } from './list-loan-alerts.use-case';
import { NotifyAvailabilityUseCase } from './notify-availability.use-case';
import { RequestAvailabilityAlertUseCase } from './request-availability-alert.use-case';
import {
  NO_EMAIL_ERROR,
  RunLoanAlertsUseCase,
} from './run-loan-alerts.use-case';

const AHORA = new Date('2026-11-26T15:00:00.000Z');
const horas = (h: number) => new Date(AHORA.getTime() + h * 3_600_000);
const reloj = { now: () => AHORA };

const prestamo = (overrides: Partial<DueLoan> = {}): DueLoan => ({
  loanId: 'l1',
  dueAt: horas(5),
  inventoryCode: 'CLENA-1',
  workTitle: 'María',
  reader: { id: 'r1', fullName: 'Ana', email: 'ana@example.org' },
  notifications: [],
  ...overrides,
});

const aviso = (overrides: Partial<PendingAvailabilityAlert> = {}) => ({
  id: 'a1',
  createdAt: horas(-24),
  workId: 'w1',
  workTitle: 'María',
  reader: { id: 'r1', fullName: 'Ana', email: 'ana@example.org' },
  ...overrides,
});

const fakeRepo = (
  overrides: Partial<LoanAlertsRepository> = {},
): jest.Mocked<LoanAlertsRepository> =>
  ({
    findDueLoans: jest.fn().mockResolvedValue([]),
    claimNotification: jest.fn().mockResolvedValue(true),
    markNotificationSent: jest.fn().mockResolvedValue(undefined),
    markNotificationFailed: jest.fn().mockResolvedValue(undefined),
    findDeliverableAvailabilityAlerts: jest.fn().mockResolvedValue([]),
    claimAvailabilityAlert: jest.fn().mockResolvedValue(true),
    releaseAvailabilityAlert: jest.fn().mockResolvedValue(undefined),
    listPendingAvailabilityAlerts: jest.fn().mockResolvedValue([]),
    findReader: jest.fn(),
    findWork: jest.fn(),
    createAvailabilityAlert: jest.fn(),
    ...overrides,
  }) as jest.Mocked<LoanAlertsRepository>;

const fakeEmail = (): jest.Mocked<EmailSender> => ({
  send: jest.fn().mockResolvedValue(undefined),
});

function revision(repo: LoanAlertsRepository, email: EmailSender) {
  return new RunLoanAlertsUseCase(
    repo,
    email,
    reloj,
    new NotifyAvailabilityUseCase(repo, email, reloj),
  );
}

describe('RunLoanAlertsUseCase', () => {
  it('envía el recordatorio de un préstamo por vencer y lo marca enviado', async () => {
    const repo = fakeRepo({
      findDueLoans: jest.fn().mockResolvedValue([prestamo()]),
    });
    const email = fakeEmail();
    const resumen = await revision(repo, email).execute();

    expect(repo.findDueLoans).toHaveBeenCalledWith(horas(48));
    expect(repo.claimNotification).toHaveBeenCalledWith('l1', 'POR_VENCER');
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.org',
        subject: 'Su préstamo vence pronto: María',
      }),
    );
    expect(repo.markNotificationSent).toHaveBeenCalledWith(
      'l1',
      'POR_VENCER',
      AHORA,
    );
    expect(resumen.reminders.sent).toBe(1);
  });

  it('usa el aviso VENCIDO cuando la fecha ya pasó', async () => {
    const repo = fakeRepo({
      findDueLoans: jest.fn().mockResolvedValue([
        prestamo({
          dueAt: horas(-3),
          notifications: [
            { type: 'POR_VENCER', sentAt: horas(-40), error: null },
          ],
        }),
      ]),
    });
    await revision(repo, fakeEmail()).execute();
    expect(repo.claimNotification).toHaveBeenCalledWith('l1', 'VENCIDO');
  });

  it('no repite un aviso que ya existe', async () => {
    const repo = fakeRepo({
      findDueLoans: jest.fn().mockResolvedValue([
        prestamo({
          notifications: [
            { type: 'POR_VENCER', sentAt: horas(-1), error: null },
          ],
        }),
      ]),
    });
    const email = fakeEmail();
    const resumen = await revision(repo, email).execute();
    expect(repo.claimNotification).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
    expect(resumen.reminders.alreadySent).toBe(1);
  });

  it('no envía si otra revisión ya tomó el aviso a la vez', async () => {
    const repo = fakeRepo({
      findDueLoans: jest.fn().mockResolvedValue([prestamo()]),
      claimNotification: jest.fn().mockResolvedValue(false),
    });
    const email = fakeEmail();
    await revision(repo, email).execute();
    expect(email.send).not.toHaveBeenCalled();
  });

  it('deja el aviso en el panel si el lector no tiene correo', async () => {
    const repo = fakeRepo({
      findDueLoans: jest
        .fn()
        .mockResolvedValue([
          prestamo({
            reader: { id: 'r2', fullName: 'Sin correo', email: null },
          }),
        ]),
    });
    const email = fakeEmail();
    const resumen = await revision(repo, email).execute();
    expect(email.send).not.toHaveBeenCalled();
    expect(repo.markNotificationFailed).toHaveBeenCalledWith(
      'l1',
      'POR_VENCER',
      NO_EMAIL_ERROR,
    );
    expect(resumen.reminders.withoutEmail).toBe(1);
  });

  it('registra el error si el correo falla', async () => {
    const repo = fakeRepo({
      findDueLoans: jest.fn().mockResolvedValue([prestamo()]),
    });
    const email = fakeEmail();
    email.send.mockRejectedValue(new Error('SMTP caído'));
    const resumen = await revision(repo, email).execute();
    expect(repo.markNotificationFailed).toHaveBeenCalledWith(
      'l1',
      'POR_VENCER',
      'SMTP caído',
    );
    expect(resumen.reminders.failed).toBe(1);
  });

  it('ignora préstamos que todavía no están cerca de vencer', async () => {
    const repo = fakeRepo({
      findDueLoans: jest
        .fn()
        .mockResolvedValue([prestamo({ dueAt: horas(72) })]),
    });
    await revision(repo, fakeEmail()).execute();
    expect(repo.claimNotification).not.toHaveBeenCalled();
  });
});

describe('NotifyAvailabilityUseCase', () => {
  it('envía el aviso una vez y lo marca', async () => {
    const repo = fakeRepo({
      findDeliverableAvailabilityAlerts: jest.fn().mockResolvedValue([aviso()]),
    });
    const email = fakeEmail();
    const resumen = await new NotifyAvailabilityUseCase(
      repo,
      email,
      reloj,
    ).execute('w1');
    expect(repo.findDeliverableAvailabilityAlerts).toHaveBeenCalledWith('w1');
    expect(repo.claimAvailabilityAlert).toHaveBeenCalledWith('a1', AHORA);
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Ya está disponible: María' }),
    );
    expect(resumen).toEqual({ sent: 1, failed: 0 });
  });

  it('no envía si otro proceso ya tomó el aviso', async () => {
    const repo = fakeRepo({
      findDeliverableAvailabilityAlerts: jest.fn().mockResolvedValue([aviso()]),
      claimAvailabilityAlert: jest.fn().mockResolvedValue(false),
    });
    const email = fakeEmail();
    await new NotifyAvailabilityUseCase(repo, email, reloj).execute();
    expect(email.send).not.toHaveBeenCalled();
  });

  it('devuelve el aviso a pendiente si el correo falla', async () => {
    const repo = fakeRepo({
      findDeliverableAvailabilityAlerts: jest.fn().mockResolvedValue([aviso()]),
    });
    const email = fakeEmail();
    email.send.mockRejectedValue(new Error('SMTP caído'));
    const resumen = await new NotifyAvailabilityUseCase(
      repo,
      email,
      reloj,
    ).execute();
    expect(repo.releaseAvailabilityAlert).toHaveBeenCalledWith('a1');
    expect(resumen).toEqual({ sent: 0, failed: 1 });
  });
});

describe('ListLoanAlertsUseCase', () => {
  it('pone los vencidos primero e indica si se envió el correo', async () => {
    const repo = fakeRepo({
      findDueLoans: jest.fn().mockResolvedValue([
        prestamo({ loanId: 'pronto', dueAt: horas(3) }),
        prestamo({
          loanId: 'vencido',
          dueAt: horas(-5),
          notifications: [{ type: 'VENCIDO', sentAt: horas(-1), error: null }],
        }),
        prestamo({ loanId: 'lejos', dueAt: horas(100) }),
      ]),
      listPendingAvailabilityAlerts: jest.fn().mockResolvedValue([aviso()]),
    });
    const panel = await new ListLoanAlertsUseCase(repo, reloj).execute();
    expect(panel.loans.map((l) => [l.loanId, l.type])).toEqual([
      ['vencido', 'VENCIDO'],
      ['pronto', 'POR_VENCER'],
    ]);
    expect(panel.loans[0].notifiedAt).toEqual(horas(-1));
    expect(panel.loans[1].notifiedAt).toBeNull();
    expect(panel.availability).toHaveLength(1);
  });
});

describe('RequestAvailabilityAlertUseCase', () => {
  const lector = { id: 'r1', fullName: 'Ana', email: 'ana@example.org' };
  const obra = { id: 'w1', title: 'María', available: false };

  it('registra el aviso para un libro no disponible', async () => {
    const repo = fakeRepo({
      findReader: jest.fn().mockResolvedValue(lector),
      findWork: jest.fn().mockResolvedValue(obra),
      createAvailabilityAlert: jest.fn().mockResolvedValue(aviso()),
    });
    await expect(
      new RequestAvailabilityAlertUseCase(repo).execute('r1', 'w1'),
    ).resolves.toMatchObject({ id: 'a1' });
    expect(repo.createAvailabilityAlert).toHaveBeenCalledWith('r1', 'w1');
  });

  it.each([
    [
      'lector inexistente',
      { findReader: jest.fn().mockResolvedValue(null) },
      ReaderNotFoundError,
    ],
    [
      'lector sin correo',
      { findReader: jest.fn().mockResolvedValue({ ...lector, email: null }) },
      ReaderWithoutEmailError,
    ],
    [
      'libro inexistente',
      {
        findReader: jest.fn().mockResolvedValue(lector),
        findWork: jest.fn().mockResolvedValue(null),
      },
      AlertWorkNotFoundError,
    ],
    [
      'libro ya disponible',
      {
        findReader: jest.fn().mockResolvedValue(lector),
        findWork: jest.fn().mockResolvedValue({ ...obra, available: true }),
      },
      WorkAlreadyAvailableError,
    ],
  ])('rechaza %s', async (_caso, overrides, errorEsperado) => {
    const repo = fakeRepo(overrides as Partial<LoanAlertsRepository>);
    await expect(
      new RequestAvailabilityAlertUseCase(repo).execute('r1', 'w1'),
    ).rejects.toBeInstanceOf(errorEsperado);
    expect(repo.createAvailabilityAlert).not.toHaveBeenCalled();
  });
});
