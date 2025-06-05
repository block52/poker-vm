#!/bin/bash

## Create a new table
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "new_table",
    "params": ["texas-holdem,cash,2,9,10000000000000000,20000000000000000,10000000000000000,1000000000000000000,30000",
    "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C"],
    "id": 1,
    "jsonrpc": "2.0"
}'
