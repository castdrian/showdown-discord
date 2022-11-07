FROM node:18 as base
WORKDIR /home/node/app
COPY .git/ ./.git/
COPY package*.json ./
COPY yarn.lock ./
RUN corepack enable
RUN yarn install
COPY . .
FROM base as production
ENV NODE_PATH=./build
EXPOSE 8080
RUN yarn run build
CMD ["node", "."]