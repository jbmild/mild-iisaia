FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY data/component-tables.json /data/component-tables.json
ENV CATALOG_PATH=/data/component-tables.json
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/server.js"]
