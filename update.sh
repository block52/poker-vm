#!/bin/bash

# curl --location 'http://localhost:3000/' \
# --header 'Content-Type: application/json' \
# --data '{
#     "method": "shutdown",
#     "params": ["username", "password"],
#     "id": 1,
#     "jsonrpc": "2.0",
#     "data": ""
# }'

pm2 stop node
cd ~
cd poker-vm/pvm/ts
git stash
git pull

yarn install
yarn build
pm2 start dist/index.js --name node
