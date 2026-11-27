import { Logger } from '@nestjs/common';
import type { EmailMessage } from '../../domain/alerts/alert-messages';
import type { EmailSender } from '../../application/ports/email-sender.port';

/** Sin SMTP_HOST configurado: deja el aviso en el log en vez de enviarlo. */
export class LogEmailSender implements EmailSender {
  private readonly logger = new Logger('Correo');

  send(message: EmailMessage): Promise<void> {
    this.logger.log(`(sin SMTP_HOST) Para ${message.to}: ${message.subject}`);
    return Promise.resolve();
  }
}
