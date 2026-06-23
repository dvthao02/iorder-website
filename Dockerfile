FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_INTEGRITY_KEYS=0
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Build backend packages
RUN pnpm --filter @iorder/contracts build && \
    pnpm --filter @iorder/database build && \
    pnpm --filter @iorder/api build

# Frontend dist/ và apps/admin/dist/ đã được pre-built và commit vào git
# (Vite 8 dùng rolldown native binding không chạy được trên linux build)
# Khi upgrade Vite hoặc dùng esbuild thì có thể bỏ comment dòng dưới:
# RUN pnpm build && pnpm --filter @iorder/admin build

EXPOSE 8080
CMD ["node", "apps/api/dist/server.js"]
