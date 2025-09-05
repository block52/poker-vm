# Dockerfile for Express (backend/Dockerfile)
FROM node:20.18.2-alpine

# Set up working directory
WORKDIR /usr/src/app

# Copy package.json
COPY package.json .

# # Copy yarn.lock if it exists
# COPY yarn.lock .

# # Copy .env.example to .env
COPY .env .

# Install dependencies
RUN yarn install

# Copy application files and build
COPY . .
RUN yarn build

# Expose port 8545 for the Express server
EXPOSE 8545

# Start the Express server
CMD [ "yarn", "start" ]
