
# Dockerfile for Nginx (nginx/Dockerfile)
FROM debian:bookworm

# Install Nginx
RUN apt-get update && \
    apt-get install -y nginx && \
    apt-get clean

# Copy the Nginx configuration file
COPY default.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the reverse proxy
EXPOSE 80

# Start Nginx
CMD [ "nginx", "-g", "daemon off;" ]