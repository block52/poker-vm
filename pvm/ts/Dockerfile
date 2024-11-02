# Dockerfile for Express (backend/Dockerfile)
FROM node:20.18-alpine

# Set up working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy application files
COPY . .

# Expose port 3000 for the Express server
EXPOSE 3000

# Start the Express server
CMD [ "yarn", "start" ]
