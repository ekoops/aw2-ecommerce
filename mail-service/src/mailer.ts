import nodemailer from "nodemailer";
import config from "./config/config";

const transporter = nodemailer.createTransport({
    host: config.mailer.host,
    port: config.mailer.port,
    secure: false, //TODO
    auth: {
        user: config.mailer.user,
        pass: config.mailer.pass,
    }
});

const sendEmail = (to: string, subject: string, text: string) => {
    return transporter.sendMail({
        from: config.mailer.user,
        to,
        subject,
        text
        // TODO: or html: ...?
    });
};

export default sendEmail;