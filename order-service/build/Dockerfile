FROM node:14.17.3

WORKDIR /home/app/server

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN groupadd app && useradd -g app -s /bin/bash app
USER app

EXPOSE 3000

ENTRYPOINT [ "node", "-r", "dotenv/config", "server.js", "dotenv_config_path=config.env" ]
