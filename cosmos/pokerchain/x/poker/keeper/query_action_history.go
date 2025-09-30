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

func (q queryServer) ListActionHistory(ctx context.Context, req *types.QueryAllActionHistoryRequest) (*types.QueryAllActionHistoryResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	actionHistorys, pageRes, err := query.CollectionPaginate(
		ctx,
		q.k.ActionHistory,
		req.Pagination,
		func(_ string, value types.ActionHistory) (types.ActionHistory, error) {
			return value, nil
		},
	)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &types.QueryAllActionHistoryResponse{ActionHistory: actionHistorys, Pagination: pageRes}, nil
}

func (q queryServer) GetActionHistory(ctx context.Context, req *types.QueryGetActionHistoryRequest) (*types.QueryGetActionHistoryResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	val, err := q.k.ActionHistory.Get(ctx, req.Index)
	if err != nil {
		if errors.Is(err, collections.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "not found")
		}

		return nil, status.Error(codes.Internal, "internal error")
	}

	return &types.QueryGetActionHistoryResponse{ActionHistory: val}, nil
}
