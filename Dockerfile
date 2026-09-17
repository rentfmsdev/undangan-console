FROM node:23-bookworm-slim AS dependencies
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
WORKDIR /app

COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_COLLAB_WS_URL
ARG NEXT_PUBLIC_ADMIN_WHATSAPP
ARG NEXT_PUBLIC_ENABLE_DEV_AUTH

ENV NODE_ENV=production \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_COLLAB_WS_URL=${NEXT_PUBLIC_COLLAB_WS_URL} \
    NEXT_PUBLIC_ADMIN_WHATSAPP=${NEXT_PUBLIC_ADMIN_WHATSAPP} \
    NEXT_PUBLIC_ENABLE_DEV_AUTH=${NEXT_PUBLIC_ENABLE_DEV_AUTH}

RUN npm run build

FROM node:23-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=2000

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/server ./server
COPY --from=builder --chown=node:node /app/scripts ./scripts
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/src/db ./src/db
COPY --from=builder --chown=node:node /app/src/modules/share-card/fonts ./src/modules/share-card/fonts
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=node:node /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=node:node /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /app/public/uploads /app/data \
    && chown -R node:node /app/public/uploads /app/data

USER node

EXPOSE 2000 2001

CMD ["npm", "run", "start"]
