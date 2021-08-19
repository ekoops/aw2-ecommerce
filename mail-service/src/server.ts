import config from "./config/config";
import getOAuth2Options from "./auth";
import MailerProxy from "./MailerProxy";
import KafkaProxy from "./kafka/KafkaProxy";
import initConsumers from "./kafka/init-consumers";
import MailService from "./services/MailService";
import express from "express"

const run = async () => {
  const OAuthO2Options = await getOAuth2Options();
  const mailerProxy = MailerProxy.getInstance(OAuthO2Options);

  const { host, port, clientId } = config.kafka;
  const broker = `${host}:${port}`;
  const kafkaProxy = KafkaProxy.getInstance(clientId, [broker]);
  const mailService = MailService.getInstance(mailerProxy);

  await initConsumers(kafkaProxy, mailService);

  const app = express();

  app.use(`${config.server.api.rootPath}/status`, (req, res) => {
    res.status(200).json({status: "on"});
  });

  app.listen(config.server.port, () => {
    console.log(`Mail service http server is listening on port ${config.server.port}`);
  })
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
