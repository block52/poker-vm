#!/bin/bash
echo "Checking if nginx is running..."
if ! pgrep nginx > /dev/null; then
	echo "nginx is not running. Setting up and starting nginx."
	bash ./nginx.sh
	if command -v systemctl > /dev/null; then
		sudo systemctl start nginx
	else
		sudo service nginx start
	fi
else
	echo "nginx is already running."
fi

pm2 stop node
pm2 delete node
nvm use 20.18
cd ~
cd poker-vm/pvm/ts
git stash
git pull
yarn install
yarn build
pm2 start dist/src/index.js --name node