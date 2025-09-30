package keeper

import (
	"context"

	errorsmod "cosmossdk.io/errors"
	"github.com/yourusername/pokerchain/x/poker/types"
)

func (k msgServer) Raise(ctx context.Context, msg *types.MsgRaise) (*types.MsgRaiseResponse, error) {
	if _, err := k.addressCodec.StringToBytes(msg.Creator); err != nil {
		return nil, errorsmod.Wrap(err, "invalid authority address")
	}

	// TODO: Handle the message

	return &types.MsgRaiseResponse{}, nil
}
