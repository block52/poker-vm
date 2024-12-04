#!/bin/bash

pm2 stop node
pm2 delete node
pm2 start node