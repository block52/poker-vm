#!/bin/bash

sudo ufw allow 22
sudo ufw allow 8000

# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

touch .env 
openssl rand -hex 32 > .env

# install node via nvm

# start docker mongodb
docker run -d -p 27017:27017 --name mongodb mongo

# install pm2
npm install pm2 -g