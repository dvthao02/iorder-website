FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_INTEGRITY_KEYS=0
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

RUN pnpm --filter @iorder/contracts build && \
    pnpm --filter @iorder/database build && \
    pnpm --filter @iorder/api build

EXPOSE 8080
CMD ["node", "apps/api/dist/server.js"]
