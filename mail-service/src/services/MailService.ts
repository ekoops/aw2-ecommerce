import MailerProxy from "../MailerProxy";
import { UserCreatedDTO } from "../dtos/UserCreatedDTO";
import Logger from "../utils/Logger";
import {OrderDTO} from "../dtos/OrderDTO";
import http, {RequestOptions} from "http";


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
    const text = `Warehouse alert! The product ${value.productName} is below the threshold. The current quantity is ${value.limit} in the warehouse located at the following address:
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

    async sendOrderStatusUpdatedMail(message: { key: string; value: OrderDTO }) {
        const { key, value } = message;
        console.log({value})
        const options = {
            hostname: 'catalog-svc',
            port: 8080,
            headers: { "Content-Type": "application/json" },
            path: `/api/v1/service/${value.buyerId}/email`,
            method: 'GET'
        }

        const req = http.request(options, res => {
            // console.log(statusCode: ${res.statusCode})

            res.on('data', d => {
                console.log("DATAAAAAA")
                const email = JSON.stringify(d)
                console.log("a")
                console.log({email})
                const email2 = JSON.parse(email)
                console.log({email2})
                console.log("b")
                const email3 = JSON.parse(email2.data)
                console.log(email3)
                 // process.stdout.write(d)

                const to = "warehouse_admin@yopmail.com";
                const subject = "[AW2 Ecommerce] Your order's status is changed";
                const text = `The order with id: ${value.id} is now in status: ${value.status}`;
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
            })
        })

        req.on('error', error => {
            console.error(error)
        })

        req.end()

    }



}
