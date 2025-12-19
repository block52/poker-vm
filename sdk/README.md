# @block52/poker-vm-sdk

TypeScript SDK for Block52 Poker VM - A blockchain-based poker engine built on Cosmos.

[![npm version](https://badge.fury.io/js/@block52%2Fpoker-vm-sdk.svg)](https://www.npmjs.com/package/@block52/poker-vm-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @block52/poker-vm-sdk
```

or

```bash
yarn add @block52/poker-vm-sdk
```

## Features

- Full TypeScript support with type definitions
- Poker game state management
- Player action handling
- Cosmos blockchain integration
- Keplr wallet support
- Hand evaluation and winner determination
- Support for cash games and tournaments (Sit & Go)

## Usage

```typescript
import { TexasHoldemGame, PlayerActionType, GameType } from '@block52/poker-vm-sdk';

// Create a new game
const game = new TexasHoldemGame({
  minBuyIn: 100n,
  maxBuyIn: 10000n,
  minPlayers: 2,
  maxPlayers: 9,
  smallBlind: 10n,
  bigBlind: 20n,
  timeout: 60000,
  type: GameType.CASH
});

// Process player actions
game.processAction({
  playerId: 'player1',
  seat: 1,
  action: PlayerActionType.JOIN,
  amount: '1000',
  signature: '0x...'
});
```

## Documentation

- **[Release Guide](./RELEASE.md)** - How to publish new versions to NPM
- **[Claude Code Instructions](./CLAUDE.md)** - Proto regeneration and development notes

## API Reference

### Game Types

- `GameType.CASH` - Cash game format
- `GameType.SIT_AND_GO` - Tournament format

### Player Actions

- `JOIN` - Join a table
- `LEAVE` - Leave a table
- `SMALL_BLIND` - Post small blind
- `BIG_BLIND` - Post big blind
- `DEAL` - Deal cards
- `FOLD` - Fold hand
- `CHECK` - Check
- `CALL` - Call bet
- `BET` - Place bet
- `RAISE` - Raise bet
- `ALL_IN` - Go all-in
- `SHOW` - Show cards
- `MUCK` - Muck cards

### Player Status

- `ACTIVE` - Player is active and can act
- `ALL_IN` - Player is all-in
- `FOLDED` - Player has folded
- `SITTING_OUT` - Player is sitting out
- `BUSTED` - Player has no chips
- `SHOWING` - Player is showing cards at showdown

## Development

### Building

```bash
yarn build
```

### Testing

```bash
yarn test
```

### Linting

```bash
yarn lint
yarn lint:fix
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Links

- **NPM Package**: https://www.npmjs.com/package/@block52/poker-vm-sdk
- **GitHub Repository**: https://github.com/block52/poker-vm
- **Issues**: https://github.com/block52/poker-vm/issues

## Version History

See [Releases](https://github.com/block52/poker-vm/releases) for version history and changelog.
