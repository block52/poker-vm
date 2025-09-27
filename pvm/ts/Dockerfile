# PVM (Poker Virtual Machine) Dockerfile
FROM node:20.19.5-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json yarn.lock* ./

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Install all dependencies (including dev dependencies)
RUN yarn install --frozen-lockfile && yarn cache clean

# Copy source code
COPY . .

# Expose port
EXPOSE 8545

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8545/health || exit 1

# Start development server with ts-node
CMD ["yarn", "dev"]

# Production build stage
FROM base AS builder
ENV NODE_ENV=production

# Install all dependencies
RUN yarn install --frozen-lockfile && yarn cache clean

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Install only production dependencies
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 8545

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8545/health || exit 1

# Start production server
CMD ["yarn", "start"]
