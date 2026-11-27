import type { EmailMessage } from '../../domain/alerts/alert-messages';

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface EmailSender {
  /** Lanza un Error si el servidor de correo rechaza el mensaje. */
  send(message: EmailMessage): Promise<void>;
}
