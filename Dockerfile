FROM node:16 as base
ARG CI=${CI}
ENV CI=${CI}
WORKDIR /home/node/app
COPY package*.json ./
RUN npm i
COPY . .
FROM base as production
ENV NODE_PATH=./build
RUN npm run start