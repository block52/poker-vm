package keeper

import (
	"context"

	"github.com/yourusername/pokerchain/x/poker/types"
)

// SetGame stores a game in the blockchain state
func (k Keeper) SetGame(ctx context.Context, game types.Game) error {
	return k.Games.Set(ctx, game.TableAddress, game)
}

// GetGame retrieves a game from the blockchain state
func (k Keeper) GetGame(ctx context.Context, tableAddress string) (types.Game, error) {
	return k.Games.Get(ctx, tableAddress)
}

// HasGame checks if a game exists
func (k Keeper) HasGame(ctx context.Context, tableAddress string) bool {
	has, err := k.Games.Has(ctx, tableAddress)
	if err != nil {
		return false
	}
	return has
}

// RemoveGame removes a game from the blockchain state
func (k Keeper) RemoveGame(ctx context.Context, tableAddress string) error {
	return k.Games.Remove(ctx, tableAddress)
}

// GetAllGames returns all games
func (k Keeper) GetAllGames(ctx context.Context) ([]types.Game, error) {
	var games []types.Game
	err := k.Games.Walk(ctx, nil, func(key string, game types.Game) (bool, error) {
		games = append(games, game)
		return false, nil
	})
	return games, err
}