# Frontend UI Dockerfile
FROM node:22.12-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json yarn.lock ./

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Install all dependencies (including dev dependencies)
# Use --ignore-engines to avoid Node version conflicts
RUN yarn install --ignore-engines && yarn cache clean

# Copy source code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5173 || exit 1

# Start development server
CMD ["yarn", "dev", "--host", "0.0.0.0"]

# Build stage
FROM base AS builder
ENV NODE_ENV=production

# Install all dependencies
# Use --ignore-engines to avoid Node version conflicts
RUN yarn install --ignore-engines && yarn cache clean

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage with Nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration if available
COPY nginx.conf* /etc/nginx/conf.d/

# Create nginx configuration for React SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://pvm:8545; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]