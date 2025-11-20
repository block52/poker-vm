#!/bin/bash

# Curl test script for creating a poker game
# This bypasses browser CORS and helps debug blockchain issues

# Configuration
RPC_ENDPOINT="https://node1.block52.xyz/rpc"
REST_ENDPOINT="https://node1.block52.xyz"
CHAIN_ID="pokerchain"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Poker VM - Create Game Test Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Check node status
echo -e "${YELLOW}📡 Test 1: Checking node status...${NC}"
NODE_INFO=$(curl -s --max-time 5 "${REST_ENDPOINT}/cosmos/base/tendermint/v1beta1/node_info")
MONIKER=$(echo "$NODE_INFO" | jq -r '.default_node_info.moniker // "No response"')
NETWORK=$(echo "$NODE_INFO" | jq -r '.default_node_info.network // "Unknown"')

if [ "$MONIKER" != "No response" ]; then
    echo -e "${GREEN}✅ Node is online${NC}"
    echo -e "   Moniker: $MONIKER"
    echo -e "   Network: $NETWORK"
else
    echo -e "${RED}❌ Node is not responding${NC}"
    exit 1
fi

# Test 2: Get latest block height
echo -e "\n${YELLOW}📊 Test 2: Getting latest block height...${NC}"
LATEST_BLOCK=$(curl -s --max-time 5 "${REST_ENDPOINT}/cosmos/base/tendermint/v1beta1/blocks/latest")
HEIGHT=$(echo "$LATEST_BLOCK" | jq -r '.block.header.height // "Unknown"')
TIME=$(echo "$LATEST_BLOCK" | jq -r '.block.header.time // "Unknown"')

if [ "$HEIGHT" != "Unknown" ]; then
    echo -e "${GREEN}✅ Latest block: $HEIGHT${NC}"
    echo -e "   Block time: $TIME"
else
    echo -e "${RED}❌ Could not get latest block${NC}"
    exit 1
fi

# Test 3: Example account query (you'll need to replace with your address)
echo -e "\n${YELLOW}🔑 Test 3: Account Information${NC}"
echo -e "${BLUE}To test your account, run:${NC}"
echo -e "curl -s \"${REST_ENDPOINT}/cosmos/auth/v1beta1/accounts/YOUR_ADDRESS\" | jq"
echo -e "\n${BLUE}To check your balance:${NC}"
echo -e "curl -s \"${REST_ENDPOINT}/cosmos/bank/v1beta1/balances/YOUR_ADDRESS\" | jq"

# Test 4: Broadcast transaction template
echo -e "\n${YELLOW}📤 Test 4: Create Game Transaction Template${NC}"
echo -e "${BLUE}To broadcast a create game transaction:${NC}"
echo -e "\n${GREEN}# Step 1: Sign the transaction (do this from the frontend/SDK)${NC}"
echo -e "# The SDK will generate a signed transaction in base64 format"
echo -e "\n${GREEN}# Step 2: Broadcast using curl${NC}"
cat << 'EOF'
curl -X POST "https://node1.block52.xyz/rpc/broadcast_tx_commit" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "broadcast_tx_commit",
    "params": {
      "tx": "BASE64_SIGNED_TX_HERE"
    }
  }' | jq
EOF

echo -e "\n${YELLOW}🎮 Test 5: Query Existing Games${NC}"
GAMES=$(curl -s --max-time 5 "${REST_ENDPOINT}/block52/pokerchain/poker/v1/games")
GAME_COUNT=$(echo "$GAMES" | jq -r '.games | length // 0')
echo -e "Games found: ${GREEN}$GAME_COUNT${NC}"

if [ "$GAME_COUNT" -gt 0 ]; then
    echo -e "\n${BLUE}Sample games:${NC}"
    echo "$GAMES" | jq -r '.games[:3] | .[] | "  Game ID: \(.id), Status: \(.status), Players: \(.players | length)"'
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Endpoint tests complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "1. Try creating a game from the frontend"
echo "2. Check browser console for the detailed logs"
echo "3. Copy the signed transaction from logs"
echo "4. Use the curl command above to broadcast it directly"
echo ""
echo -e "${YELLOW}📚 Useful Commands:${NC}"
echo "# Get all games:"
echo "curl -s '${REST_ENDPOINT}/block52/pokerchain/poker/v1/games' | jq"
echo ""
echo "# Get specific game:"
echo "curl -s '${REST_ENDPOINT}/block52/pokerchain/poker/v1/game/GAME_ID' | jq"
echo ""
echo "# Get game state:"
echo "curl -s '${REST_ENDPOINT}/block52/pokerchain/poker/v1/game_state/GAME_ID' | jq"
