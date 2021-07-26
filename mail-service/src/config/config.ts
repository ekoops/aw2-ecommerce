const hostname = process.env.SERVER_HOSTNAME || "localhost";
const port = process.env.SERVER_PORT || 3000;

const mailer_host = process.env.MAILER_HOST;
const mailer_port = process.env.MAILER_PORT || 587;
const mailer_user = process.env.MAILER_USER;
const mailer_pass = process.env.MAILER_PASS;

const config = {
  server: {
    hostname,
    port: +port,
  },
  mailer: {
    host: mailer_host,
    port: +mailer_port,
    user: mailer_user,
    pass: mailer_pass,
  },
};

export default config;
