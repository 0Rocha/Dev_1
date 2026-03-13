# =============================================================================
# Dockerfile multi-stage — Next.js (output: standalone)
# Base: Node 22.12.0 Alpine. Runner como usuário não-root.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage: builder
# -----------------------------------------------------------------------------
FROM node:22.12.0-alpine AS builder

WORKDIR /app

# Dependências (cache se package*.json não mudar)
COPY app/package*.json ./
RUN npm ci

# Código e build
COPY app/ ./
RUN npm run build

# -----------------------------------------------------------------------------
# Stage: runner
# -----------------------------------------------------------------------------
FROM node:22.12.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário não-root
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Output standalone: server + estáticos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]