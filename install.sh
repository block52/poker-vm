#!/bin/bash

sudo ufw allow 22
sudo ufw allow 8000

# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

touch .env 
openssl rand -hex 32 > .env