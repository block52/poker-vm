# Dockerfile for Express (backend/Dockerfile)
FROM node:20.18-alpine

# Set up working directory
WORKDIR /usr/src/app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application files and build
COPY . .
RUN yarn build

# Expose port 3000 for the Express server
EXPOSE 3000

# Start the Express server
CMD [ "yarn", "start" ]
