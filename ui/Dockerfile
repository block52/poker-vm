# Frontend Dockerfile - /ui/Dockerfile
FROM node:20.18.2-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
# Install dependencies
RUN yarn install --frozen-lockfile && yarn cache clean

# Development stage
FROM base AS dev
WORKDIR /app

# Copy package files
COPY package*.json ./
# Install all dependencies (including dev dependencies)
RUN yarn install

# Copy source code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Start development server
CMD ["yarn", "dev", "--host", "0.0.0.0"]

# # Build stage
# FROM base AS builder
# WORKDIR /app

# # Copy package files
# COPY package*.json ./
# # Install all dependencies
# RUN npm ci

# # Copy source code
# COPY . .

# # Build the application
# RUN npm run build

# # Production stage with Nginx
# FROM nginx:alpine AS production

# # Copy built files from builder stage
# COPY --from=builder /app/dist /usr/share/nginx/html

# # Copy custom nginx configuration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Expose port
# EXPOSE 80

# # Start Nginx
# CMD ["nginx", "-g", "daemon off;"]