#!/bin/bash

# Set player 1 address
PLAYER1="0xC84737526E425D7549eF20998Fa992f88EAC2484"

# Set player 2 address
PLAYER2="0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8"


# Table ID
TABLE_ID="0xccd6e31012fd0ade9beb377c2f20661b832abfe7"

## Call the other bash script
bash 01-blinds-deal.sh

sleep 1

## Player 1 calls
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "call", "10000000000000000", 0, 6],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 1 checks
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "check", "", 0, 7],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 2 bets
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "bet", "20000000000000000", 0, 8],
    "id": 1,
    "jsonrpc": "2.0"
}'

sleep 1

## Player 1 folds
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xC84737526E425D7549eF20998Fa992f88EAC2484", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "fold", "", 0, 9],
    "id": 1,
    "jsonrpc": "2.0"
}'

