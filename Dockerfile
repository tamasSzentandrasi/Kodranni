FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps
COPY adapters ./adapters
COPY packaging ./packaging
RUN npm ci --omit=dev && NODE_OPTIONS=--experimental-sqlite npm run build:campaign-ui
ENV NODE_OPTIONS=--experimental-sqlite
EXPOSE 8742
USER node
CMD ["node", "--experimental-sqlite", "--import", "tsx", "apps/cli/src/main.ts", "live", "--tunnel", "--bot"]
