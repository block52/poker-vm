#!/bin/bash

## Purge the mempool
curl --location 'http://localhost:8545' \
--header 'Content-Type: application/json' \
--data '{
    "method": "purge",
    "params": ["admin", "password"],
    "id": 1,
    "jsonrpc": "2.0"
}'
