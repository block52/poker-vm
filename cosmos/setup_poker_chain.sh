#!/bin/bash

set -e  # Exit on any error

echo "Setting up Block52 Poker Chain..."

# Check if Ignite CLI is installed
if ! command -v ignite &> /dev/null; then
    echo "Ignite CLI not found. Installing..."
    curl https://get.ignite.com/cli! | bash
    export PATH=$PATH:$HOME/go/bin
fi

# Clean up existing pokerchain if it exists
if [ -d "pokerchain" ]; then
    echo "Removing existing pokerchain directory..."
    rm -rf pokerchain
fi

# Create a new Cosmos chain
echo "Creating new Cosmos chain..."
ignite scaffold chain github.com/block52/poker-vm/cosmos/pokerchain --address-prefix b52

cd pokerchain

# Scaffold the poker module with required dependencies
echo "Scaffolding poker module..."
ignite scaffold module poker --dep bank,staking

# Scaffold message types for poker table management
echo "Scaffolding CreateGame message..."
ignite scaffold message create-game \
  gameId:string \
  minBuyIn:uint \
  maxBuyIn:uint \
  minPlayers:int \
  maxPlayers:int \
  smallBlind:uint \
  bigBlind:uint \
  timeout:int \
  gameType:string \
  --module poker

echo "Scaffolding game actions..."
ignite scaffold message join-game \
  gameId:string \
  seat:uint \
  buyIn:uint \
  --module poker

ignite scaffold message leave-game \
  gameId:string \
  --module poker

ignite scaffold message deal-cards \
  gameId:string \
  --module poker

ignite scaffold message perform-action \
  gameId:string \
  action:string \
  amount:uint \
  --module poker

echo "Scaffolding bridge actions..."
ignite scaffold message mint \
  recipient:string \
  amount:uint \
  ethTxHash:string \
  nonce:uint \
  --module poker

ignite scaffold message burn \
  amount:uint \
  ethRecipient:string \
  --module poker

# Scaffold queries
echo "Scaffolding queries..."
ignite scaffold query game \
  gameId:string \
  --response game \
  --module poker

ignite scaffold query list-games \
  --response games \
  --module poker

ignite scaffold query player-games \
  playerAddress:string \
  --response games \
  --module poker

ignite scaffold query legal-actions \
  gameId:string \
  playerAddress:string \
  --response actions \
  --module poker

# Scaffold the game state storage
echo "Scaffolding storage maps..."
ignite scaffold map game \
  gameId:string \
  status:string \
  round:string \
  pot:uint \
  communityCards:string \
  dealer:uint \
  smallBlindPos:uint \
  bigBlindPos:uint \
  currentPlayer:uint \
  gameOptions:string \
  --module poker --no-message

ignite scaffold map player-state \
  gameId:string \
  playerAddress:string \
  seat:uint \
  chips:uint \
  holeCards:string \
  status:string \
  --module poker --no-message

ignite scaffold map action-history \
  gameId:string \
  round:string \
  actionIndex:uint \
  playerAddress:string \
  actionType:string \
  amount:uint \
  --module poker --no-message

echo ""
echo "🎉 Poker chain scaffolded successfully!"
echo ""
echo "Next steps:"
echo "1. cd pokerchain"
echo "2. ignite chain serve"
echo "3. Test the CreateTable endpoint at http://localhost:1317"
echo ""
echo "The chain will include:"
echo "- Custom b52 address prefix" 
echo "- CreateTable message with REST API"
echo "- Complete poker game messages and queries"
echo "- Game state storage (games, player states, action history)"