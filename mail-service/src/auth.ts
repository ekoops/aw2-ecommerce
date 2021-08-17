import config from "./config/config";
import { google } from "googleapis";

const { user, clientId, clientSecret, redirectUri, refreshToken } = config.oauth2;

const oAuth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

oAuth2Client.setCredentials({ refresh_token: refreshToken });

const getOAuth2Options = async () => {
  const accessToken = (await oAuth2Client.getAccessToken()) as string;
  const OAuth2Options: OAuth2Options = {
    user,
    clientId,
    clientSecret,
    refreshToken,
    accessToken,
  };
  return OAuth2Options;
};

export default getOAuth2Options;
