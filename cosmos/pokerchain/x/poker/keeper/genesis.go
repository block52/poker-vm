package keeper

import (
	"context"

	"github.com/yourusername/pokerchain/x/poker/types"
)

// InitGenesis initializes the module's state from a provided genesis state.
func (k Keeper) InitGenesis(ctx context.Context, genState types.GenesisState) error {
	for _, elem := range genState.PlayerStateMap {
		if err := k.PlayerState.Set(ctx, elem.Index, elem); err != nil {
			return err
		}
	}
	for _, elem := range genState.ActionHistoryMap {
		if err := k.ActionHistory.Set(ctx, elem.Index, elem); err != nil {
			return err
		}
	}
	for _, elem := range genState.Games {
		if err := k.Games.Set(ctx, elem.TableAddress, elem); err != nil {
			return err
		}
	}

	return k.Params.Set(ctx, genState.Params)
}

// ExportGenesis returns the module's exported genesis.
func (k Keeper) ExportGenesis(ctx context.Context) (*types.GenesisState, error) {
	var err error

	genesis := types.DefaultGenesis()
	genesis.Params, err = k.Params.Get(ctx)
	if err != nil {
		return nil, err
	}
	if err := k.PlayerState.Walk(ctx, nil, func(_ string, val types.PlayerState) (stop bool, err error) {
		genesis.PlayerStateMap = append(genesis.PlayerStateMap, val)
		return false, nil
	}); err != nil {
		return nil, err
	}
	if err := k.ActionHistory.Walk(ctx, nil, func(_ string, val types.ActionHistory) (stop bool, err error) {
		genesis.ActionHistoryMap = append(genesis.ActionHistoryMap, val)
		return false, nil
	}); err != nil {
		return nil, err
	}
	if err := k.Games.Walk(ctx, nil, func(_ string, val types.Game) (stop bool, err error) {
		genesis.Games = append(genesis.Games, val)
		return false, nil
	}); err != nil {
		return nil, err
	}

	return genesis, nil
}
