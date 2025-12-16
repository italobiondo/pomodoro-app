# 1) Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

# Args para variáveis públicas do Next (injetadas no build)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_ENV

# Expõe essas vars como ENV durante o build (Next lê no build)
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}

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
