#

## Mint

curl --location 'http://localhost:3000/' \
--header 'Content-Type: application/json' \
--data '{
    "method": "mint",
    "params": [
        "0x2aFfD5A147ffA7F449da28AB787C3A121d62Abe2"
    ],
    "id": 1,
    "jsonrpc": "2.0"
}'

curl --location 'http://localhost:3000/' \
--header 'Content-Type: application/json' \
--data '{
    "method": "get_mempool",
    "params": [],
    "id": 1, "jsonrpc": "2.0"
}'