FROM node:20.12-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]