# Base layer
FROM node:20 as base
WORKDIR /home/node/app

# Build layer (everything besides build output & node_modules can be disgarded from this)
FROM base as build

COPY yarn.lock package.json ./
COPY .git ./.git
RUN yarn
COPY . .
RUN yarn run build

# Production layer, only copy required files to run.
FROM base as production

ENV NODE_ENV=production
COPY --from=build /home/node/app/package.json ./
COPY --from=build /home/node/app/node_modules ./node_modules
COPY --from=build /home/node/app/.git ./.git
COPY --from=build /home/node/app/dist ./dist
COPY --from=build /home/node/app/data ./data

CMD ["node", "."]
