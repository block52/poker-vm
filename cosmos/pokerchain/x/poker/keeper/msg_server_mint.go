package keeper

import (
	"context"

	"pokerchain/x/poker/types"

	errorsmod "cosmossdk.io/errors"
)

func (k msgServer) Mint(ctx context.Context, msg *types.MsgMint) (*types.MsgMintResponse, error) {
	if _, err := k.addressCodec.StringToBytes(msg.Creator); err != nil {
		return nil, errorsmod.Wrap(err, "invalid authority address")
	}

	// TODO: Handle the message

	return &types.MsgMintResponse{}, nil
}
