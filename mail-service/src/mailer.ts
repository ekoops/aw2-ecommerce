import nodemailer from "nodemailer";
import config from "./config/config";

const { user } = config.oauth2;

const initMailer = (
  options: OAuth2Options
): ((to: string, subject: string, text: string) => Promise<unknown>) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user,
      ...options,
    },
  });

  return (to: string, subject: string, text: string) => {
    const mailOptions = {
      from: user,
      to,
      subject,
      text,
      html: text,
    };
    return transporter.sendMail(mailOptions);
  };
};

export default initMailer;
