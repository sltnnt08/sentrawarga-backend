FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY src ./src
COPY prisma.config.ts ./prisma.config.ts

RUN DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy" npx prisma generate

EXPOSE 3000