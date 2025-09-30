#!/bin/bash

# Set player 1 address
PLAYER1="0xC84737526E425D7549eF20998Fa992f88EAC2484"

# Set player 2 address
PLAYER2="0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8"


# Table ID
TABLE_ID="0xccd6e31012fd0ade9beb377c2f20661b832abfe7"

## Call the other bash script
bash showdown-shows.sh

sleep 1

## Player 2 shows
curl --location 'http://localhost:8545' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", "0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "new-hand", "", 0, 10, "7392648510739462850173946285017394628501739462850199"],
    "id": 1,
    "jsonrpc": "2.0"
}'
