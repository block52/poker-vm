# PVM (Poker Virtual Machine) Dockerfile
FROM node:22.12-alpine

# Install system dependencies
RUN apk add --no-cache curl && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --ignore-engines --production && yarn cache clean

# Copy pre-compiled dist folder
COPY dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create websocket-logs directory and set permissions before switching user
RUN mkdir -p /app/websocket-logs \
  && chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 8545

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8545/ || exit 1

# Start the server - run from dist
CMD ["node", "dist/index.js"]
