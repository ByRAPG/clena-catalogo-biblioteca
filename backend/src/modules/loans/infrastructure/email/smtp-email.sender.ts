import { Logger } from '@nestjs/common';
import { Socket, createConnection } from 'node:net';
import type { EmailMessage } from '../../domain/alerts/alert-messages';
import type { EmailSender } from '../../application/ports/email-sender.port';

export interface SmtpSettings {
  host: string;
  port: number;
  from: string;
  timeoutMs?: number;
}

/** Codifica un encabezado con tildes (RFC 2047). */
function encodeHeader(value: string): string {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function address(value: string): string {
  const match = /<([^>]+)>/.exec(value);
  return match ? match[1] : value.trim();
}

/** Quita saltos de línea para que nadie inyecte encabezados. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ');
}

/**
 * Cliente SMTP mínimo sin dependencias, pensado para Mailpit en desarrollo
 * (sin TLS ni autenticación). En producción se cambia el adaptador por uno
 * con TLS sin tocar los casos de uso.
 */
export class SmtpEmailSender implements EmailSender {
  private readonly logger = new Logger(SmtpEmailSender.name);

  constructor(private readonly settings: SmtpSettings) {}

  async send(message: EmailMessage): Promise<void> {
    const to = oneLine(message.to);
    const from = oneLine(this.settings.from);
    const body = message.text
      .replace(/\r?\n/g, '\r\n')
      // Una línea que empieza con «.» se duplica (transparencia SMTP).
      .replace(/^\./gm, '..');
    const data =
      `From: ${from}\r\n` +
      `To: ${to}\r\n` +
      `Subject: ${encodeHeader(oneLine(message.subject))}\r\n` +
      `Date: ${new Date().toUTCString()}\r\n` +
      'MIME-Version: 1.0\r\n' +
      'Content-Type: text/plain; charset=utf-8\r\n' +
      'Content-Transfer-Encoding: 8bit\r\n' +
      `\r\n${body}\r\n.`;

    const session = await SmtpSession.open(this.settings);
    try {
      await session.expect(220);
      await session.command('EHLO clena.local', 250);
      await session.command(`MAIL FROM:<${address(from)}>`, 250);
      await session.command(`RCPT TO:<${address(to)}>`, 250);
      await session.command('DATA', 354);
      await session.command(data, 250);
      await session.command('QUIT', 221).catch(() => undefined);
    } finally {
      session.close();
    }
    this.logger.log(`Correo enviado a ${address(to)}: ${message.subject}`);
  }
}

/** Lee respuestas SMTP completas (incluidas las de varias líneas). */
class SmtpSession {
  private buffer = '';
  private waiting: ((reply: { code: number; text: string }) => void) | null =
    null;
  private failure: Error | null = null;

  private constructor(private readonly socket: Socket) {
    socket.setEncoding('utf8');
    socket.on('data', (chunk: string) => {
      this.buffer += chunk;
      this.flush();
    });
    socket.on('error', (error) => {
      this.failure = error;
      this.waiting?.({ code: 0, text: error.message });
    });
  }

  static open(settings: SmtpSettings): Promise<SmtpSession> {
    return new Promise((resolve, reject) => {
      const socket = createConnection(settings.port, settings.host);
      socket.setTimeout(settings.timeoutMs ?? 10_000, () =>
        socket.destroy(new Error('El servidor de correo no respondió a tiempo')),
      );
      socket.once('connect', () => resolve(new SmtpSession(socket)));
      socket.once('error', reject);
    });
  }

  async command(line: string, expected: number): Promise<void> {
    this.socket.write(`${line}\r\n`);
    await this.expect(expected);
  }

  async expect(expected: number): Promise<void> {
    const reply = await this.next();
    if (reply.code !== expected) {
      throw new Error(`SMTP respondió ${reply.code}: ${reply.text.trim()}`);
    }
  }

  close(): void {
    this.socket.end();
  }

  private next(): Promise<{ code: number; text: string }> {
    if (this.failure) return Promise.reject(this.failure);
    return new Promise((resolve) => {
      this.waiting = resolve;
      this.flush();
    });
  }

  private flush(): void {
    if (!this.waiting) return;
    // Una respuesta termina en una línea «NNN texto» (sin guion tras el código).
    const lines = this.buffer.split('\r\n');
    const last = lines.findIndex((l) => /^\d{3}(?: |$)/.test(l));
    if (last === -1) return;
    const text = lines.slice(0, last + 1).join('\n');
    this.buffer = lines.slice(last + 1).join('\r\n');
    const resolve = this.waiting;
    this.waiting = null;
    resolve({ code: Number(lines[last].slice(0, 3)), text });
  }
}
