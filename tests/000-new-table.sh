#!/bin/bash

## Create a new table
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "new_table",
    "params": [],
    "id": 1,
    "jsonrpc": "2.0"
}'
