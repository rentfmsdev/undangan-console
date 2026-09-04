# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS dependencies
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm install

FROM dependencies AS builder
WORKDIR /app

COPY . .

# NEXT_PUBLIC variables are embedded into the browser bundle by `next build`.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:3000/collaboration-ws
ARG NEXT_PUBLIC_ADMIN_WHATSAPP=
ARG NEXT_PUBLIC_ENABLE_DEV_AUTH=false

ENV NODE_ENV=production \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_COLLAB_WS_URL=${NEXT_PUBLIC_COLLAB_WS_URL} \
    NEXT_PUBLIC_ADMIN_WHATSAPP=${NEXT_PUBLIC_ADMIN_WHATSAPP} \
    NEXT_PUBLIC_ENABLE_DEV_AUTH=${NEXT_PUBLIC_ENABLE_DEV_AUTH} \
    DATABASE_URL=mysql://build-only:build-only@127.0.0.1:3306/build-only

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Keep dependencies in the shared image because the web server, collaboration
# daemon, and Drizzle migration job use different packages from the same lockfile.
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/server ./server
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/src/db ./src/db
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=node:node /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=node:node /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /app/public/uploads /app/data \
    && chown -R node:node /app/public/uploads /app/data

USER node

EXPOSE 3000 3001

CMD ["npm", "run", "start"]
