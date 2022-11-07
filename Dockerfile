FROM node:18 as base
WORKDIR /home/node/app
COPY .git/ ./.git/
COPY package*.json ./
RUN npm i
COPY . .
FROM base as production
ENV NODE_PATH=./build
EXPOSE 8080
RUN npm run build
CMD ["node", "."]