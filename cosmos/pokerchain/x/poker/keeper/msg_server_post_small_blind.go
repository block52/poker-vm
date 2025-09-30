package keeper

import (
	"context"

	errorsmod "cosmossdk.io/errors"
	"github.com/yourusername/pokerchain/x/poker/types"
)

func (k msgServer) PostSmallBlind(ctx context.Context, msg *types.MsgPostSmallBlind) (*types.MsgPostSmallBlindResponse, error) {
	if _, err := k.addressCodec.StringToBytes(msg.Creator); err != nil {
		return nil, errorsmod.Wrap(err, "invalid authority address")
	}

	// TODO: Handle the message

	return &types.MsgPostSmallBlindResponse{}, nil
}
