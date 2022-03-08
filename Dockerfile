FROM node:16 as base
WORKDIR /home/node/app
COPY package*.json ./
RUN npm i
COPY . .
ARG CI
FROM base as production
ENV NODE_PATH=./build
RUN npm run start