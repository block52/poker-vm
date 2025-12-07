# Poker VM Glossary

This document defines all the key functions, verbs, and concepts used in the Poker VM application.

## Player State Functions

### `getNextPlayerToAct()`

Returns the next player who needs to take an action in the current betting round. This function considers:

-   Current dealer position
-   Players who are still active (not folded, busted, or all-in)
-   Betting round completion status
-   Whether all players have acted or need to match the current bet

### `setPlayerStatus(playerId: string, status: PlayerStatus)`

Updates a player's current status in the game. Used to transition players between states like ACTIVE, FOLDED, ALL_IN, etc.

### `isPlayerActive(playerId: string): boolean`

Checks if a player can currently take actions. Returns true if player status is ACTIVE or NOT_ACTED.

### `getActivePlayers(): PlayerDTO[]`

Returns an array of all players who can still participate in the current hand (not folded, busted, or sitting out).

## Game Flow Functions

### `dealCards()`

Distributes cards to players at the start of a new hand. Handles:

-   Dealing hole cards to each active player
-   Managing deck state
-   Encrypting/decrypting card data

### `advanceRound()`

Moves the game from one betting round to the next (preflop → flop → turn → river → showdown).

### `collectBlinds()`

Forces the small blind and big blind players to post their required bets at the start of a hand.

### `calculateWinners()`

Determines which player(s) win the pot(s) at showdown by comparing hand strengths.

### `distributePots()`

Awards chips to winning players and handles side pots when players are all-in with different stack sizes.

## Action Processing Functions

### `validateAction(action: ActionDTO): boolean`

Checks if a proposed player action is legal given the current game state:

-   Correct player turn
-   Valid action type for current situation
-   Proper bet/raise amounts

### `executeAction(action: ActionDTO)`

Processes a validated player action and updates the game state accordingly.

### `getLegalActions(playerId: string): LegalActionDTO[]`

Returns all valid actions a specific player can take, including minimum/maximum bet amounts.

## Betting Functions

### `calculateMinRaise(): bigint`

Determines the minimum amount a player must raise by (typically the size of the last raise).

### `calculatePotOdds(): number`

Computes the ratio of current pot size to the cost of calling, used for strategy decisions.

### `handleAllIn(playerId: string, amount: bigint)`

Processes when a player bets all their remaining chips, creating side pots if necessary.

## Position Functions

### `getPlayerPosition(playerId: string): number`

Returns the seat number/position of a specific player.

### `rotateDealer()`

Moves the dealer button to the next active player after a hand completes.

### `getSmallBlindPosition(): number`

Returns the seat number of the current small blind player.

### `getBigBlindPosition(): number`

Returns the seat number of the current big blind player.

## Game State Functions

### `saveGameState()`

Persists the current game state to storage/database.

### `loadGameState(address: string): TexasHoldemStateDTO`

Retrieves a saved game state by contract address.

### `resetHand()`

Prepares the game for a new hand by:

-   Clearing community cards
-   Resetting player actions
-   Collecting and shuffling deck
-   Moving dealer button

## Payout Functions

### `calculatePayout(place: number): bigint`

Determines prize money for tournament finishing positions (1st, 2nd, 3rd place).

### `calculateCurrentPayout(): bigint`

Returns the payout amount for the next player to be eliminated in a tournament.

## Validation Functions

### `exists(playerAddress: string): boolean`

Checks if a player is currently registered in the game.

### `canJoin(): boolean`

Determines if new players can join the game based on status and seat availability.

### `hasEnoughChips(playerId: string, amount: bigint): boolean`

Verifies a player has sufficient chips to make a specific bet.

## Utility Functions

### `getAvailableSeats(): number[]`

Returns array of unoccupied seat numbers where new players can join.

### `shuffleDeck()`

Randomizes the order of cards in the deck before dealing.

### `encryptCards(cards: Card[]): string`

Converts card data to encrypted format for storage/transmission.

### `decryptCards(data: string): Card[]`

Converts encrypted card data back to readable card objects.

## Status Definitions

### PlayerStatus Enum Values:

-   **NOT_ACTED**: Player hasn't taken an action this betting round
-   **ACTIVE**: Player is in the hand and can take actions
-   **FOLDED**: Player has folded and is out of the current hand
-   **ALL_IN**: Player has bet all their chips
-   **BUSTED**: Player has lost all chips and is eliminated
-   **SITTING_OUT**: Player is temporarily not participating
-   **SITTING_IN**: Player is ready to participate in hands
-   **SHOWING**: Player is revealing cards at showdown

### GameStatus Enum Values:

-   **WAITING_FOR_PLAYERS**: Not enough players to start
-   **REGISTRATION**: Tournament signup period
-   **IN_PROGRESS**: Game is actively running
-   **FINISHED**: Game has completed

### TexasHoldemRound Enum Values:

-   **ANTE**: Optional pre-deal forced bet phase
-   **PREFLOP**: After hole cards dealt, before community cards
-   **FLOP**: After first 3 community cards revealed
-   **TURN**: After 4th community card revealed
-   **RIVER**: After 5th community card revealed
-   **SHOWDOWN**: Comparing hands to determine winner
-   **END**: Hand completed, preparing for next hand
