#!/bin/bash

cd ~
cd poker-vm
git stash
git pull
# git clone https://github.com/block52/poker-vm.git
cd /pvm/ts
yarn install
yarn build
