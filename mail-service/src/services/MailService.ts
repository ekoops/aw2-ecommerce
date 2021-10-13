import MailerProxy from "../MailerProxy";
import { UserCreatedDTO } from "../dtos/UserCreatedDTO";
import Logger from "../utils/Logger";

const NAMESPACE = "MAIL_SERVICE";

export default class MailService {
  private static _instance: MailService;

  private constructor(private mailerProxy: MailerProxy) {}

  static getInstance(mailerProxy: MailerProxy) {
    return this._instance || (this._instance = new this(mailerProxy));
  }

  async sendVerificationMail(message: { key: string; value: UserCreatedDTO }) {
    const { key, value: userCreatedDTO } = message;
    const to = userCreatedDTO.email;
    const subject = "[AW2 Ecommerce] Please confirm your email address";
    const text = `Hi ${userCreatedDTO.customerInfo.name},
please verify your email address by using the following link:
http://localhost:8080/api/v1/auth/confirmRegistration?token=${userCreatedDTO.emailVerificationTokenInfo.token}
`;
    const mail = { to, subject, text };
    return this.mailerProxy.send(mail).catch((err) => {
      Logger.error(
        NAMESPACE,
        `sendVerificationMail(message: ${message}): failed to send email to ${to}: ${
          err.message || "-"
        }`
      );
    });
  }


  async sendThresholdMail(message: { key: string; value: {warehouseAddress: string, productName: string, limit: number} }) {
    const { key, value } = message;

    console.log({message})
    const to = "warehouse_admin@yopmail.com";
    const subject = "[AW2 Ecommerce] Warehouse alert! Product is below limit";
    const text = `Warehouse alert! The product ${value.productName} is below the limit of ${value.limit} in the warehouse located at the following address:
    ${value.warehouseAddress}
`;
    const mail = { to, subject, text };
    console.log({mail})
    return this.mailerProxy.send(mail).catch(err => {
      Logger.error(
        NAMESPACE,
        `sendThresholdMail(message: ${message}): failed to send email to ${to}: ${
          err.message || "-"
        }`
      );
    });
  }
}
