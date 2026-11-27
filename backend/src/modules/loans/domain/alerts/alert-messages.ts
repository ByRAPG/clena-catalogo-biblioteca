import type { DueAlertType } from './due-alert';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

const FIRMA = '\n\nBiblioteca del CLENA\nEste es un mensaje automático.';

function fecha(d: Date): string {
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });
}

/** Recordatorio de devolución (HU-21). */
export function dueReminderMessage(input: {
  to: string;
  readerName: string;
  workTitle: string;
  inventoryCode: string;
  dueAt: Date;
  type: DueAlertType;
}): EmailMessage {
  const vencido = input.type === 'VENCIDO';
  return {
    to: input.to,
    subject: vencido
      ? `Préstamo vencido: ${input.workTitle}`
      : `Su préstamo vence pronto: ${input.workTitle}`,
    text:
      `Hola, ${input.readerName}.\n\n` +
      (vencido
        ? `El préstamo de «${input.workTitle}» (ejemplar ${input.inventoryCode}) venció el ${fecha(input.dueAt)}. Por favor devuélvalo en el mostrador lo antes posible.`
        : `El préstamo de «${input.workTitle}» (ejemplar ${input.inventoryCode}) vence el ${fecha(input.dueAt)}. Puede devolverlo en el mostrador.`) +
      FIRMA,
  };
}

/** «Avísame cuando esté disponible» (HU-21). */
export function availabilityMessage(input: {
  to: string;
  readerName: string;
  workTitle: string;
}): EmailMessage {
  return {
    to: input.to,
    subject: `Ya está disponible: ${input.workTitle}`,
    text:
      `Hola, ${input.readerName}.\n\n` +
      `«${input.workTitle}» ya tiene un ejemplar disponible en la biblioteca. Puede pedirlo en el mostrador.` +
      FIRMA,
  };
}
