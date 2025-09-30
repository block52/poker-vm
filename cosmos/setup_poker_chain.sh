#!/bin/bash

# Install Ignite CLI if not already installed
# curl https://get.ignite.com/cli! | bash

# Create a new Cosmos chain
ignite scaffold chain github.com/yourusername/pokerchain

cd pokerchain

# Scaffold the poker module
ignite scaffold module poker --dep bank,staking

# Scaffold message types for poker actions
ignite scaffold message create-game \
  minBuyIn:uint \
  maxBuyIn:uint \
  smallBlind:uint \
  bigBlind:uint \
  maxPlayers:uint \
  minPlayers:uint \
  --module poker

ignite scaffold message join-game \
  gameId:uint \
  seat:uint \
  buyIn:uint \
  --module poker

ignite scaffold message leave-game \
  gameId:uint \
  --module poker

ignite scaffold message deal-cards \
  gameId:uint \
  --module poker

ignite scaffold message post-small-blind \
  gameId:uint \
  --module poker

ignite scaffold message post-big-blind \
  gameId:uint \
  --module poker

ignite scaffold message fold \
  gameId:uint \
  --module poker

ignite scaffold message check \
  gameId:uint \
  --module poker

ignite scaffold message bet \
  gameId:uint \
  amount:uint \
  --module poker

ignite scaffold message call \
  gameId:uint \
  --module poker

ignite scaffold message raise \
  gameId:uint \
  amount:uint \
  --module poker

ignite scaffold message show-cards \
  gameId:uint \
  --module poker

ignite scaffold message muck-cards \
  gameId:uint \
  --module poker

# Scaffold queries
ignite scaffold query game \
  gameId:uint \
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
  gameId:uint \
  playerAddress:string \
  --response actions \
  --module poker

# Scaffold the game state storage
ignite scaffold map game \
  gameId:uint \
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
  gameId:uint \
  playerAddress:string \
  seat:uint \
  chips:uint \
  holeCards:string \
  status:string \
  --module poker --no-message

ignite scaffold map action-history \
  gameId:uint \
  round:string \
  actionIndex:uint \
  playerAddress:string \
  actionType:string \
  amount:uint \
  --module poker --no-message

echo "Poker chain scaffolded successfully!"
echo "Next steps:"
echo "1. Implement the poker game logic in x/poker/keeper/"
echo "2. Add validation and state management"
echo "3. Run 'ignite chain serve' to start your chain"