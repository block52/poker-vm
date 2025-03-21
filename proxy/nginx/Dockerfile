FROM debian:bookworm-slim

# Install Nginx and other necessary packages
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    openssl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Remove default nginx config
RUN rm /etc/nginx/sites-enabled/default

# Copy the custom nginx config files
COPY conf /etc/nginx/conf.d/

# Forward request logs to Docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

# Expose ports
EXPOSE 80 443

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]