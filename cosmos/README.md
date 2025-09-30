# Poker Chain - Cosmos SDK Blockchain for Texas Hold'em

A Cosmos SDK blockchain implementation for decentralized poker games using Ignite CLI.

## Features

- **Decentralized Poker Games**: Create and play Texas Hold'em poker games on-chain
- **Multi-player Support**: Support for 2-10 players per table
- **Transparent Game Logic**: All game actions recorded on-chain
- **Fair Dealing**: Cryptographically secure card dealing
- **Escrow System**: Automatic chip management through the blockchain
- **Query Support**: Query game state, player information, and legal actions

## Prerequisites

- Go 1.21 or higher
- Ignite CLI v28.0.0 or higher
- Node.js 18+ (for frontend integration)

## Installation

### 1. Install Ignite CLI

```bash
curl https://get.ignite.com/cli! | bash
```

### 2. Create the Chain

Run the setup script:
```bash
./setup_poker_chain.sh
```

This will:
- Scaffold a new Cosmos chain
- Create the poker module
- Generate all message types and queries
- Set up game state storage

### 3. Implement Custom Logic

After scaffolding, you'll need to:

1. Copy the keeper implementation to `x/poker/keeper/game.go`
2. Copy the protobuf definitions to `proto/poker/poker.proto`
3. Run `ignite generate proto-go` to generate Go types
4. Implement message handlers in `x/poker/keeper/msg_server_*.go`

## Project Structure

```
pokerchain/
├── app/                    # Application configuration
├── cmd/                    # CLI commands
├── proto/                  # Protocol buffer definitions
│   └── poker/
│       └── poker.proto    # Poker module types
├── x/                      # Custom modules
│   └── poker/             # Poker game module
│       ├── keeper/        # Business logic
│       │   ├── game.go   # Core game implementation
│       │   ├── msg_server.go
│       │   └── query.go
│       ├── types/         # Generated types
│       └── module.go      # Module definition
└── config.yml             # Chain configuration
```

## Usage

### Start the Chain

```bash
ignite chain serve
```

This will:
- Build the chain binary
- Initialize a local testnet
- Start the blockchain
- Make the chain available on localhost:26657

### Create a Game

```bash
pokerchaind tx poker create-game \
  --min-buy-in 100 \
  --max-buy-in 10000 \
  --small-blind 5 \
  --big-blind 10 \
  --max-players 6 \
  --min-players 2 \
  --from alice
```

### Join a Game

```bash
pokerchaind tx poker join-game \
  --game-id 1 \
  --seat 1 \
  --buy-in 1000 \
  --from bob
```

### Query Game State

```bash
# Get game information
pokerchaind query poker game 1

# List all games
pokerchaind query poker list-games

# Get player's games
pokerchaind query poker player-games $(pokerchaind keys show alice -a)

# Get legal actions for a player
pokerchaind query poker legal-actions 1 $(pokerchaind keys show alice -a)
```

### Play Actions

```bash
# Deal cards (dealer/first player)
pokerchaind tx poker deal-cards --game-id 1 --from alice

# Post blinds
pokerchaind tx poker post-small-blind --game-id 1 --from bob
pokerchaind tx poker post-big-blind --game-id 1 --from charlie

# Betting actions
pokerchaind tx poker fold --game-id 1 --from alice
pokerchaind tx poker check --game-id 1 --from bob
pokerchaind tx poker bet --game-id 1 --amount 20 --from charlie
pokerchaind tx poker call --game-id 1 --from alice
pokerchaind tx poker raise --game-id 1 --amount 40 --from bob

# Showdown
pokerchaind tx poker show-cards --game-id 1 --from alice
pokerchaind tx poker muck-cards --game-id 1 --from bob
```

## Game Flow

1. **Create Game**: A player creates a game with specific options
2. **Join Game**: Players join at available seats with their buy-in
3. **Deal Cards**: Dealer deals hole cards to all players
4. **Post Blinds**: Small and big blinds are posted
5. **Betting Rounds**: 
   - Preflop: After hole cards are dealt
   - Flop: After 3 community cards
   - Turn: After 4th community card
   - River: After 5th community card
6. **Showdown**: Remaining players show or muck cards
7. **Distribute Pot**: Winners receive their share

## Game States

- **waiting**: Game created, waiting for minimum players
- **active**: Game in progress
- **ended**: Hand completed, ready for new hand

## Player States

- **active**: Player in hand, can act
- **folded**: Player folded current hand
- **all_in**: Player wagered all chips
- **sitting_out**: Player at table but not in hand
- **showing**: Player revealed cards at showdown

## Betting Rounds

1. **ante**: Initial setup, blinds posted
2. **preflop**: After hole cards dealt
3. **flop**: After 3 community cards
4. **turn**: After 4th community card
5. **river**: After 5th community card
6. **showdown**: Card reveal and winner determination
7. **end**: Hand complete

## Integration with TypeScript Code

Your existing TypeScript implementation can be adapted to work with the chain:

1. **Game State Synchronization**: The chain stores authoritative game state
2. **Action Validation**: On-chain keeper validates all actions
3. **Card Privacy**: Hole cards encrypted/hidden until showdown
4. **Automatic Progression**: Chain automatically advances rounds when complete

## Development

### Run Tests

```bash
go test ./x/poker/...
```

### Build Binary

```bash
ignite chain build
```

### Reset Chain

```bash
pokerchaind tendermint unsafe-reset-all
```

## API Endpoints

When the chain is running, you can interact via:

- **RPC**: http://localhost:26657
- **API**: http://localhost:1317
- **gRPC**: localhost:9090

### Example API Queries

```bash
# Get game by ID
curl http://localhost:1317/pokerchain/poker/game/1

# List all games
curl http://localhost:1317/pokerchain/poker/games

# Get player games
curl http://localhost:1317/pokerchain/poker/player-games/cosmos1...
```

## Security Considerations

1. **Randomness**: Implement VRF (Verifiable Random Function) for card shuffling
2. **Card Privacy**: Use encryption for hole cards
3. **Front-running Protection**: Action indices prevent replay attacks
4. **Timeout Handling**: Auto-fold players who exceed time limits
5. **Chip Security**: Module escrow prevents unauthorized withdrawals

## Future Enhancements

- [ ] Tournament support
- [ ] Sit & Go games
- [ ] Rake/fee collection
- [ ] Player statistics
- [ ] Table chat (IBC messages)
- [ ] Multi-table tournaments
- [ ] VRF-based shuffling
- [ ] Zero-knowledge proofs for card privacy
- [ ] Cross-chain play (IBC)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Apache 2.0

## Resources

- [Cosmos SDK Documentation](https://docs.cosmos.network)
- [Ignite CLI Documentation](https://docs.ignite.com)
- [Tendermint Documentation](https://docs.tendermint.com)
- [IBC Protocol](https://ibcprotocol.org)

## Support

For questions and support:
- GitHub Issues: [Create an issue](https://github.com/yourusername/pokerchain/issues)
- Discord: Join our community server
- Documentation: Check the `/docs` folder