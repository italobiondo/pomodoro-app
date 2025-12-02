# infra/backend/Dockerfile

# 1) Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia apenas os manifests primeiro (cache melhor)
COPY backend/package.json backend/package-lock.json* ./
RUN npm install

# Agora copia TODO o código do backend para /app
COPY backend/. .

# Build do Nest (gera dist/)
RUN npm run build

# 2) Etapa de runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copia artefatos de build e node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "dist/src/main.js"]
