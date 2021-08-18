import express from "express";
import config from "./config/config";
import getOAuth2Options from "./auth";
import MailerProxy from "./MailerProxy";

const run = async () => {
  const OAuthO2Options = await getOAuth2Options();
  const mailer = MailerProxy.getInstance(OAuthO2Options);

  const app = express();

  app.post("/mails", async (req, res) => {
    const to = req.body.to;
    const subject = req.body.subject;
    const text = req.body.text;
    try {
      await sendEmail(to, subject, text);
      res.json({
        ok: "ok",
      });
    } catch (ex) {
      res.json({
        error: "error",
      });
    }
  });
  app.listen(config.server.port, () => {
    console.log(`Server is listening on port ${config.server.port}`);
  });
  const result = await mailer.send("email@gmail.com", "prova di email", "prova di email");
  console.log(result);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
