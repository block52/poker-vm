#!/bin/bash
curl --location 'http://localhost:8545' \
--header 'Content-Type: application/json' \
--data '{
    "method": "mint",
    "params": ["0x8bF18655DFEfc8A4615AB7eb3aB01F6E8cC6134E", 100],
    "id": 1,
    "jsonrpc": "2.0",
    "data": "0xe05Af8f0689F0BcB7A90FA97B877b4CD14373e5F"
}'