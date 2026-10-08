FROM node:24-alpine AS build
ARG VITE_API_URL=/api
ARG VITE_DOCUVATE_BUILD_SHA=dev
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DOCUVATE_BUILD_SHA=$VITE_DOCUVATE_BUILD_SHA
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/contracts/package.json packages/contracts/
COPY packages/tokens/package.json packages/tokens/
COPY packages/ui-catalog/package.json packages/ui-catalog/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile=false --ignore-scripts --filter @docuvate/web...
COPY packages/contracts packages/contracts
COPY packages/tokens packages/tokens
COPY packages/ui-catalog packages/ui-catalog
COPY apps/web apps/web
COPY docs/connectors-oauth-setup.md docs/connectors-oauth-setup.md
RUN pnpm --filter "@docuvate/web..." build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
