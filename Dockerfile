FROM node:24.8-trixie-slim AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:24.8-trixie-slim AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:24.8-trixie-slim AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:24.8-trixie-slim
COPY ./package.json package-lock.json server.js drizzle.config.ts /app/
COPY ./drizzle /app/drizzle
COPY ./scripts /app/scripts
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["npm", "run", "start"]