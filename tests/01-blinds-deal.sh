#!/bin/bash

# Set player 1 address
PLAYER1="0xC84737526E425D7549eF20998Fa992f88EAC2484"
# Set player 2 address
PLAYER2="0xccd6e31012fd0ade9beb377c2f20661b832abfe7"

TABLE_ID="0xccd6e31012fd0ade9beb377c2f20661b832abfe7"

## Purge the mempool
bash 00-purge-mempool.sh

sleep 1

## Player 1 joins the table
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "join", "1000000000000000000", 0, 1, 1],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 2 joins the table
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "join", "1000000000000000000", 0, 2, 2],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 1 small blind
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "post-small-blind", "10000000000000000", 0, 3],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 2 big blind
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "post-big-blind", "20000000000000000", 0, 4],
    "id": 1,
    "jsonrpc": "2.0"
}'

## Deal cards
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "deal", "", 0, 5, "2415244220693136377713921289748740858699681395268293"],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

# ## Player 1 calls
# curl --location 'http://localhost:3000' \
# --header 'Content-Type: application/json' \
# --data '{
#     "method": "perform_action",
#     "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "call", "10000000000000000", 0, 5],
#     "id": 1,
#     "jsonrpc": "2.0"
# }'

# sleep 1

# ## Player 2 folds
# curl --location 'http://localhost:3000' \
# --header 'Content-Type: application/json' \
# --data '{
#     "method": "perform_action",
#     "params": ["0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "fold", "", 0, 6],
#     "id": 1,
#     "jsonrpc": "2.0"
# }'