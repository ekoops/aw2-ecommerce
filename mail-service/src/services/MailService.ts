import MailerProxy from "../MailerProxy";
import {UserCreatedDTO} from "../dtos/UserCreatedDTO";
import Logger from "../utils/Logger";
import {OrderDTO} from "../dtos/OrderDTO";
import http, {RequestOptions} from "http";
import {rejects} from "assert";


const NAMESPACE = "MAIL_SERVICE";

export default class MailService {
    private static _instance: MailService;

    private constructor(private mailerProxy: MailerProxy) {
    }

    static getInstance(mailerProxy: MailerProxy) {
        return this._instance || (this._instance = new this(mailerProxy));
    }

    async sendVerificationMail(message: { key: string; value: UserCreatedDTO }) {
        const {key, value: userCreatedDTO} = message;
        const to = userCreatedDTO.email;
        const subject = "[AW2 Ecommerce] Please confirm your email address";
        const text = `Hi ${userCreatedDTO.name},
please verify your email address by using the following link:
http://localhost:8080/api/v1/auth/confirmRegistration?token=${userCreatedDTO.emailVerificationTokenInfo.token}
`;
        const mail = {to, subject, text};
        return this.mailerProxy.send(mail).catch((err) => {
            Logger.error(
                NAMESPACE,
                `sendVerificationMail(message: ${message}): failed to send email to ${to}: ${
                    err.message || "-"
                }`
            );
        });
    }


    async sendThresholdMail(message: { key: string; value: { warehouseAddress: string, productName: string, limit: number } }) {
        const {key, value} = message;

        console.log({message})
        const to = "aw2admin@yopmail.com";
        const subject = "[AW2 Ecommerce] Warehouse alert! Product is below limit";
        const text = `Warehouse alert! The product ${value.productName} is below the threshold. The current quantity is ${value.limit} in the warehouse located at the following address:
    ${value.warehouseAddress}
`;
        const mail = {to, subject, text};
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
        const {key, value} = message;
        console.log({value})
        const options = {
            hostname: 'catalog-svc',
            port: 8080,
            headers: {"Content-Type": "application/json"},
            path: `/api/v1/service/${value.buyerId}/email`,
            method: 'GET'
        }
        let output = "";
        const emailPromise = new Promise<string>((resolve , reject) => {
            const req = http.request(options, (res) => {
                res.setEncoding("utf8");

                res.on("data", (chunk) => {
                    output += chunk;
                });

                res.on("end", () => {
                    if (res.statusCode === 404) {
                        console.log("404")
                        reject()
                        return
                    }
                    resolve(output)
                });
            });

            req.end()
        })
        const email = await emailPromise
        console.log(email)
        const to = email;
        const subject = "[AW2 Ecommerce] Your order's status is changed";
        const text = `The order with id: ${value.id} is now in status: ${value.status}`;
        const mail = {to, subject, text};
        console.log({mail})
        this.mailerProxy.send(mail).catch(err => {
            Logger.error(
                NAMESPACE,
                `sendOrderStatusUpdatedMail(message: ${message}): failed to send email to ${to}: ${
                    err.message || "-"
                }`
            );
        });
        const mail2 = {
            subject, text, to: "aw2admin@yopmail.com"
        };
        return this.mailerProxy.send(mail2).catch(err => {
            Logger.error(
              NAMESPACE,
              `sendOrderStatusUpdatedMail(message: ${message}): failed to send email to ${to}: ${
                err.message || "-"
              }`
            );
        });
    }

}
