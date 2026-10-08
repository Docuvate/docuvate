FROM node:24.21.0-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.34.6 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/contracts/package.json packages/contracts/
COPY packages/otel/package.json packages/otel/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile=false --ignore-scripts --filter @docuvate/api...
COPY packages/contracts packages/contracts
COPY packages/otel packages/otel
COPY apps/api apps/api
COPY scripts/db scripts/db
RUN pnpm --filter "@docuvate/api..." build

FROM node:24.21.0-alpine AS runner
RUN apk add --no-cache bash postgresql-client
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
