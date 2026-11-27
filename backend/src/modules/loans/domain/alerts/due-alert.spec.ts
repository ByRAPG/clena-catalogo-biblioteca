import { availabilityMessage, dueReminderMessage } from './alert-messages';
import { classifyDueDate, compareDueAlerts, dueSoonLimit } from './due-alert';

const AHORA = new Date('2026-11-26T15:00:00.000Z');
const horas = (h: number) => new Date(AHORA.getTime() + h * 3_600_000);

describe('classifyDueDate', () => {
  it('marca vencido si la fecha límite ya pasó', () => {
    expect(classifyDueDate(horas(-1), AHORA)).toBe('VENCIDO');
  });

  it('marca por vencer si faltan menos de 48 horas', () => {
    expect(classifyDueDate(horas(1), AHORA)).toBe('POR_VENCER');
    expect(classifyDueDate(horas(47.9), AHORA)).toBe('POR_VENCER');
  });

  it('no avisa si faltan 48 horas o más', () => {
    expect(classifyDueDate(horas(48), AHORA)).toBeNull();
    expect(classifyDueDate(horas(200), AHORA)).toBeNull();
  });

  it('el límite de la revisión es dentro de 48 horas', () => {
    expect(dueSoonLimit(AHORA)).toEqual(horas(48));
  });
});

describe('compareDueAlerts', () => {
  it('pone los vencidos primero y luego el más urgente', () => {
    const lista = [
      { type: 'POR_VENCER' as const, dueAt: horas(10) },
      { type: 'VENCIDO' as const, dueAt: horas(-1) },
      { type: 'POR_VENCER' as const, dueAt: horas(2) },
      { type: 'VENCIDO' as const, dueAt: horas(-30) },
    ].sort(compareDueAlerts);
    expect(lista.map((a) => a.dueAt)).toEqual([
      horas(-30),
      horas(-1),
      horas(2),
      horas(10),
    ]);
  });
});

describe('mensajes de correo', () => {
  it('el recordatorio dice si está vencido o por vencer', () => {
    const base = {
      to: 'lectora@example.org',
      readerName: 'Lectora',
      workTitle: 'María',
      inventoryCode: 'CLENA-1',
      dueAt: AHORA,
    };
    expect(dueReminderMessage({ ...base, type: 'VENCIDO' }).subject).toBe(
      'Préstamo vencido: María',
    );
    const pronto = dueReminderMessage({ ...base, type: 'POR_VENCER' });
    expect(pronto.subject).toBe('Su préstamo vence pronto: María');
    expect(pronto.text).toContain('CLENA-1');
  });

  it('el aviso de disponibilidad nombra el libro', () => {
    const m = availabilityMessage({
      to: 'a@example.org',
      readerName: 'Ana',
      workTitle: 'María',
    });
    expect(m).toMatchObject({
      to: 'a@example.org',
      subject: 'Ya está disponible: María',
    });
  });
});
