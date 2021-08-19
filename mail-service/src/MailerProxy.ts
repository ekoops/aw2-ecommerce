import nodemailer from "nodemailer";
import config from "./config/config";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import {MailSendingFailedException} from "./exceptions/mail-exceptions";

export default class MailerProxy {
  private static _instance: MailerProxy;
  private transporter: Mail<SMTPTransport.SentMessageInfo>;

  private constructor(private options: OAuth2Options) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        ...options,
      },
    });
  }

  static getInstance(options: OAuth2Options) {
    return this._instance || (this._instance = new this(options));
  }

  send(mail: { to: string; subject: string; text: string }): Promise<void> {
    const mailOptions = {
      from: `WA2 Ecommerce <${this.options.user}>`,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.text,
    };

    let retry = 3;
    return new Promise<void>((resolve, reject) => {
      const schedule = (retry: number) => {
        if (retry === 0) return reject(new MailSendingFailedException());
        setTimeout(async () => {
          try {
            const { accepted } = await this.transporter.sendMail(mailOptions);
            if (accepted.length === 1) return resolve();
            return schedule(retry - 1);
          } catch (ex) {
            if (retry === 1) return reject(new MailSendingFailedException(ex.message));
            return schedule(retry - 1);
          }
        }, (3 - retry) * 2000);
      };

      schedule(3);
    });
  }
}
