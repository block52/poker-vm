#!/bin/bash

# Set player 1 address
PLAYER1="0xC84737526E425D7549eF20998Fa992f88EAC2484"

# Set player 2 address
PLAYER2="0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8"


# Table ID
TABLE_ID="0xccd6e31012fd0ade9beb377c2f20661b832abfe7"

## Purge the mempool
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "purge",
    "params": ["admin", "password"],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 1 joins the table
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "join", "1000000000000000000", 0, 0, 1],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 2 joins the table
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "join", "1000000000000000000", 0, 1, 2],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 1 small blind
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "post-small-blind", "10000000000000000", 0, 2],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 2 big blind
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "post-big-blind", "20000000000000000", 0, 3],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Deal cards
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "deal", "123456", 0, 4],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 1 calls
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "call", "10000000000000000", 0, 5],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 1 checks
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "check", "", 0, 6],
    "id": 1,
    "jsonrpc": "2.0"
}'

# sleep 2

# ## Player 2 bets
# curl --location 'http://localhost:3000' \
# --header 'Content-Type: application/json' \
# --data '{
#     "method": "perform_action",
#     "params": ["0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "bet", "20000000000000000", 0, 7],
#     "id": 1,
#     "jsonrpc": "2.0"
# }'

# ## Player 1 folds
# curl --location 'http://localhost:3000' \
# --header 'Content-Type: application/json' \
# --data '{
#     "method": "perform_action",
#     "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "fold", "", 0, 7],
#     "id": 1,
#     "jsonrpc": "2.0"
# }'

# ## Player 2 shows
# curl --location 'http://localhost:3000' \
# --header 'Content-Type: application/json' \
# --data '{
#     "method": "perform_action",
#     "params": ["0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "show", "", 0, 8],
#     "id": 1,
#     "jsonrpc": "2.0"
# }'
