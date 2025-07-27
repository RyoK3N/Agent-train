# Dockerfile for Vocalis AI

# 1. Base Image for dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Base Image for building the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Environment variables can be passed at build time
# Example: docker build --build-arg NEXT_PUBLIC_API_URL=...
ENV NEXT_PUBLIC_FIREBASE_API_KEY="dummy"
RUN npm run build

# 3. Production Image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# You can copy a dedicated user for security best practices
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs
# USER nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
