#!/bin/bash
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "mint",
    "params": ["0x8bF18655DFEfc8A4615AB7eb3aB01F6E8cC6134E"],
    "id": 1,
    "jsonrpc": "2.0"
}'