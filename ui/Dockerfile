# Frontend UI Dockerfile
FROM node:22.12-alpine

# Install system dependencies
RUN apk add --no-cache curl && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --ignore-engines && yarn cache clean

# Copy source code
COPY . .

# Expose port for development server
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start development server
CMD ["yarn", "dev", "--host", "0.0.0.0"]