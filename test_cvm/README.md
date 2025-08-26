# Poker VM Test Suite

This folder contains test scripts for testing the Poker VM blockchain node functionality.

## Test Files

-   `test-game.js`: Original test script that creates a contract schema and joins players to a game
-   `active_test/rpc-join-leave-test.js`: New RPC-based test that implements the join/leave tests using the RPC interface

## Prerequisites

1. Make sure the Poker VM node is running on http://localhost:8545
2. Install dependencies: `yarn install` or `npm install`

## Running Tests

### Basic Game Creation Test

This test will:

-   Wait for the node to be available
-   Create accounts for test players
-   Create a contract schema
-   Join players to the game
-   Post blinds and deal cards

```
yarn test
```

### RPC Join/Leave Tests

This test converts the unit tests from `texasHoldem-join-and-leave.test.ts` to RPC-based tests:

-   Waits for the node to be available
-   Creates accounts for all players
-   Creates a contract schema
-   Tests player joining functionality
-   Tests that a player cannot join twice
-   Tests player positions are tracked correctly
-   Tests that a player can leave the game

```
yarn test:rpc-join-leave
```

## Test Structure

Both test files use similar patterns but perform different tests:

1. Setup: Connect to the node, create accounts, wait for mining
2. Game creation: Create a contract schema (game)
3. Test execution: Run specific test cases
4. Verification: Check results against expected outcomes

## Troubleshooting

If tests fail with "Operation failed" when joining a game, the most likely cause is that the server is having issues with game initialization. Make sure that:

1. The RPC server is properly running
2. The contract schema creation succeeded
3. Mining has completed before tests are run

You can adjust wait times in the configuration if needed.
