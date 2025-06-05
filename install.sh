#!/bin/bash

pm2 stop node
pm2 delete node
nvm use 20.18
cd ~
cd poker-vm/pvm/ts
rm -R dist 
docker compose down
git stash
git pull
yarn install
yarn build
docker compose up -d
pm2 start dist/src/index.js --name node

# sudo ufw allow 22
# sudo ufw allow 8000

# # install nvm
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

# # install node via nvm

# # start docker mongodb
# docker run -d -p 27017:27017 --name mongodb mongo

# # install pm2
# npm install pm2 -g