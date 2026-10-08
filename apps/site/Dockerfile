FROM node:24.21.0-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.34.6 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/tokens/package.json packages/tokens/
COPY openapi/docuvate.v1.json openapi/
COPY openapi/site-public-metadata.mjs openapi/
COPY openapi/site-public-metadata.en.mjs openapi/
COPY docs/assets/logo docs/assets/logo
COPY apps/site/package.json apps/site/
RUN pnpm install --frozen-lockfile=false --ignore-scripts --filter @docuvate/site...
COPY packages/tokens packages/tokens
COPY apps/site apps/site
RUN pnpm --filter "@docuvate/site..." build

FROM nginx:alpine
COPY apps/site/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/site/dist /usr/share/nginx/html
EXPOSE 80
