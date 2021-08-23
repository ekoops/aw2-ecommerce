import config from "./config/config";
import getOAuth2Options from "./auth";
import MailerProxy from "./MailerProxy";
import KafkaProxy from "./kafka/KafkaProxy";
import initConsumers from "./kafka/init-consumers";
import MailService from "./services/MailService";
import express from "express"
import Logger from "./utils/logger";

const NAMESPACE = "MAIL_SVC";

const run = async () => {
  const OAuthO2Options = await getOAuth2Options();
  const mailerProxy = MailerProxy.getInstance(OAuthO2Options);

  const { host, port, clientId } = config.kafka;
  const broker = `${host}:${port}`;
  const kafkaProxy = KafkaProxy.getInstance(clientId, [broker]);
  const mailService = MailService.getInstance(mailerProxy);

  await initConsumers(kafkaProxy, mailService);

  const app = express();

  const {port: webServerPort, api: {rootPath}} = config.server;

  app.use(`${rootPath}/status`, (req, res) => {
    res.status(200).json({status: "on"});
  });

  app.listen(webServerPort, () => {
    Logger.log(NAMESPACE, `Mail service http server is listening on port ${webServerPort}`);
  })
};

run().catch(err => {
  Logger.error(NAMESPACE, err);
  process.exit(1);
});
