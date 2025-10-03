package keeper

import (
	"context"

	"pokerchain/x/poker/types"

	errorsmod "cosmossdk.io/errors"
)

func (k msgServer) LeaveGame(ctx context.Context, msg *types.MsgLeaveGame) (*types.MsgLeaveGameResponse, error) {
	if _, err := k.addressCodec.StringToBytes(msg.Creator); err != nil {
		return nil, errorsmod.Wrap(err, "invalid authority address")
	}

	// TODO: Handle the message

	return &types.MsgLeaveGameResponse{}, nil
}
