# infra/frontend/Dockerfile

# 1) Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia apenas arquivos de dependência primeiro (cache melhor)
COPY frontend/package.json frontend/package-lock.json* ./

RUN npm install

# Copia o resto do código
COPY frontend .

# Build de produção
RUN npm run build

# 2) Etapa de runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copia apenas o necessário do builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "run", "start"]
