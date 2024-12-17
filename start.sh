#!/bin/bash
pm2 stop node
pm2 delete node
nvm use 20.18
cd ~
cd poker-vm/pvm/ts
git stash
git pull
yarn install
yarn build
pm2 start dist/index.js --name node