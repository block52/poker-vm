package keeper

import (
	"context"
	"strconv"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/yourusername/pokerchain/x/poker/types"
)

func (k msgServer) CreateTable(ctx context.Context, msg *types.MsgCreateTable) (*types.MsgCreateTableResponse, error) {
	// Validate the message
	if err := msg.ValidateBasic(); err != nil {
		return nil, err
	}

	// Check if table already exists
	if k.HasGame(ctx, msg.TableAddress) {
		return nil, types.ErrGameAlreadyExists.Wrapf("table with address %s already exists", msg.TableAddress)
	}

	// Convert context to SDK context for timestamp
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// Create game state
	game := types.Game{
		TableAddress: msg.TableAddress,
		TableType:    msg.TableType,
		BuyIn:        msg.BuyIn,
		Players:      []types.Player{},
		Status:       types.GameStatus_WAITING,
		SmallBlind:   msg.SmallBlind,
		BigBlind:     msg.BigBlind,
		MaxPlayers:   msg.MaxPlayers,
		MinPlayers:   msg.MinPlayers,
		CreatedAt:    uint64(sdkCtx.BlockTime().Unix()),
	}

	// Store in blockchain state
	err := k.SetGame(ctx, game)
	if err != nil {
		return nil, err
	}

	// Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"table_created",
			sdk.NewAttribute("table_address", msg.TableAddress),
			sdk.NewAttribute("creator", msg.Creator),
			sdk.NewAttribute("table_type", msg.TableType.String()),
			sdk.NewAttribute("buy_in", strconv.FormatUint(msg.BuyIn, 10)),
		),
	)

	return &types.MsgCreateTableResponse{
		TableAddress: msg.TableAddress,
	}, nil
}
