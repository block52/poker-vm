#!/bin/bash

# stop nginx
service nginx stop

cp /nginx/default /etc/nginx/sites-available/default
chmod 644 /etc/nginx/sites-available/default

## restart nginx
service nginx restart