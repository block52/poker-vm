#!/bin/bash

curl --location 'http://localhost:3000/' \
--header 'Content-Type: application/json' \
--data '{
    "method": "shutdown",
    "params": ["username", "password"],
    "id": 1,
    "jsonrpc": "2.0",
    "data": ""
}'

git stash
git pull
# git clone https://github.com/block52/poker-vm.git
cd pvm/ts
yarn install
yarn build
