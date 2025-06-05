#!/bin/bash

# Set player 1 address
PLAYER1="0xC84737526E425D7549eF20998Fa992f88EAC2484"

# Set player 2 address
PLAYER2="0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8"


# Table ID
TABLE_ID="0x5f724657a7248077331f1139ee0453324c06b693"

## Call the other bash script
bash 02-showdown.sh

sleep 1

## Player 2 shows
curl --location 'http://localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "method": "perform_action",
    "params": ["0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", "0x5f724657a7248077331f1139ee0453324c06b693", "show", "", 0, 10],
    "id": 1,
    "jsonrpc": "2.0"
}'
