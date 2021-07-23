import express from "express";
import config from "./config/config";
import sendEmail from "./mailer";

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

app.listen(config.server.port, config.server.hostname, () => {
  console.log(
    `Server is listening on ${config.server.hostname}:${config.server.port}`
  );
});
