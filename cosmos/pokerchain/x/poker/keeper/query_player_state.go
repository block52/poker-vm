package keeper

import (
	"context"
	"errors"

	"cosmossdk.io/collections"
	"github.com/cosmos/cosmos-sdk/types/query"
	"github.com/yourusername/pokerchain/x/poker/types"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (q queryServer) ListPlayerState(ctx context.Context, req *types.QueryAllPlayerStateRequest) (*types.QueryAllPlayerStateResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	playerStates, pageRes, err := query.CollectionPaginate(
		ctx,
		q.k.PlayerState,
		req.Pagination,
		func(_ string, value types.PlayerState) (types.PlayerState, error) {
			return value, nil
		},
	)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &types.QueryAllPlayerStateResponse{PlayerState: playerStates, Pagination: pageRes}, nil
}

func (q queryServer) GetPlayerState(ctx context.Context, req *types.QueryGetPlayerStateRequest) (*types.QueryGetPlayerStateResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	val, err := q.k.PlayerState.Get(ctx, req.Index)
	if err != nil {
		if errors.Is(err, collections.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "not found")
		}

		return nil, status.Error(codes.Internal, "internal error")
	}

	return &types.QueryGetPlayerStateResponse{PlayerState: val}, nil
}
