const abortFn = (envVar: string) => {
  throw new Error(`The ${envVar} environment variable is required`);
};

const environment = process.env.NODE_ENV || "unknown";

const hostname = process.env.SERVER_HOSTNAME || "localhost";
const port = process.env.SERVER_PORT || 3000;

const user = process.env.OAUTH2_USER || abortFn("OAUTH2_USER");
const clientId = process.env.OAUTH2_CLIENT_ID || abortFn("OAUTH2_CLIENT_ID");
const clientSecret =
  process.env.OAUTH2_CLIENT_SECRET || abortFn("OAUTH2_CLIENT_SECRET");
const redirectUri =
  process.env.OAUTH2_REDIRECT_URI || abortFn("OAUTH2_REDIRECT_URI");
const refreshToken =
  process.env.OAUTH2_REFRESH_TOKEN || abortFn("OAUTH2_REFRESH_TOKEN");


const config = {
  environment,
  server: {
    hostname,
    port: +port,
  },
  oauth2: {
    user,
    clientId,
    clientSecret,
    redirectUri,
    refreshToken,
  },
};

export default config;
