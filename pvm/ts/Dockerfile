# Dockerfile for Express (backend/Dockerfile)
FROM debian:bookworm

# Set up working directory
WORKDIR /usr/src/app

# Install Node.js, npm, and necessary dependencies
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs=20.18.* && \
    apt-get clean

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install yarn -g

# Copy application files
COPY . .

# Expose port 3000 for the Express server
EXPOSE 3000

# Start the Express server
CMD [ "yarn", "start" ]
