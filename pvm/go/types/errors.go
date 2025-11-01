package types

import "errors"

var (
	// Player errors
	ErrPlayerNotFound    = errors.New("player not found")
	ErrInsufficientChips = errors.New("insufficient chips")
	ErrInvalidSeat       = errors.New("invalid seat number")
	ErrSeatOccupied      = errors.New("seat is already occupied")
	ErrPlayerNotActive   = errors.New("player is not active")

	// Action errors
	ErrInvalidAction    = errors.New("invalid action")
	ErrActionOutOfTurn  = errors.New("action out of turn")
	ErrInvalidBetAmount = errors.New("invalid bet amount")
	ErrBelowMinimumBet  = errors.New("bet amount below minimum")
	ErrAboveMaximumBet  = errors.New("bet amount above maximum")

	// Game errors
	ErrGameNotStarted     = errors.New("game has not started")
	ErrGameAlreadyStarted = errors.New("game has already started")
	ErrGameFinished       = errors.New("game has finished")
	ErrNotEnoughPlayers   = errors.New("not enough players to start game")
	ErrTooManyPlayers     = errors.New("too many players")

	// Round errors
	ErrInvalidRound     = errors.New("invalid round")
	ErrRoundNotComplete = errors.New("betting round not complete")
)
