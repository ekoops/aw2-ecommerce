import nodemailer from "nodemailer";
import config from "./config/config";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

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

  send(to: string, subject: string, text: string) {
    const mailOptions = {
      from: `WA2 Ecommerce <${this.options.user}>`,
      to,
      subject,
      text,
      html: text,
    };
    return this.transporter.sendMail(mailOptions);
  }
}
