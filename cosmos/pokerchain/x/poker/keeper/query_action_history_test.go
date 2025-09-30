package keeper_test

import (
	"context"
	"strconv"
	"testing"

	"github.com/cosmos/cosmos-sdk/types/query"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/yourusername/pokerchain/x/poker/keeper"
	"github.com/yourusername/pokerchain/x/poker/types"
)

func createNActionHistory(keeper keeper.Keeper, ctx context.Context, n int) []types.ActionHistory {
	items := make([]types.ActionHistory, n)
	for i := range items {
		items[i].Index = strconv.Itoa(i)
		items[i].GameId = uint64(i)
		items[i].Round = strconv.Itoa(i)
		items[i].ActionIndex = uint64(i)
		items[i].PlayerAddress = strconv.Itoa(i)
		items[i].ActionType = strconv.Itoa(i)
		items[i].Amount = uint64(i)
		_ = keeper.ActionHistory.Set(ctx, items[i].Index, items[i])
	}
	return items
}

func TestActionHistoryQuerySingle(t *testing.T) {
	f := initFixture(t)
	qs := keeper.NewQueryServerImpl(f.keeper)
	msgs := createNActionHistory(f.keeper, f.ctx, 2)
	tests := []struct {
		desc     string
		request  *types.QueryGetActionHistoryRequest
		response *types.QueryGetActionHistoryResponse
		err      error
	}{
		{
			desc: "First",
			request: &types.QueryGetActionHistoryRequest{
				Index: msgs[0].Index,
			},
			response: &types.QueryGetActionHistoryResponse{ActionHistory: msgs[0]},
		},
		{
			desc: "Second",
			request: &types.QueryGetActionHistoryRequest{
				Index: msgs[1].Index,
			},
			response: &types.QueryGetActionHistoryResponse{ActionHistory: msgs[1]},
		},
		{
			desc: "KeyNotFound",
			request: &types.QueryGetActionHistoryRequest{
				Index: strconv.Itoa(100000),
			},
			err: status.Error(codes.NotFound, "not found"),
		},
		{
			desc: "InvalidRequest",
			err:  status.Error(codes.InvalidArgument, "invalid request"),
		},
	}
	for _, tc := range tests {
		t.Run(tc.desc, func(t *testing.T) {
			response, err := qs.GetActionHistory(f.ctx, tc.request)
			if tc.err != nil {
				require.ErrorIs(t, err, tc.err)
			} else {
				require.NoError(t, err)
				require.EqualExportedValues(t, tc.response, response)
			}
		})
	}
}

func TestActionHistoryQueryPaginated(t *testing.T) {
	f := initFixture(t)
	qs := keeper.NewQueryServerImpl(f.keeper)
	msgs := createNActionHistory(f.keeper, f.ctx, 5)

	request := func(next []byte, offset, limit uint64, total bool) *types.QueryAllActionHistoryRequest {
		return &types.QueryAllActionHistoryRequest{
			Pagination: &query.PageRequest{
				Key:        next,
				Offset:     offset,
				Limit:      limit,
				CountTotal: total,
			},
		}
	}
	t.Run("ByOffset", func(t *testing.T) {
		step := 2
		for i := 0; i < len(msgs); i += step {
			resp, err := qs.ListActionHistory(f.ctx, request(nil, uint64(i), uint64(step), false))
			require.NoError(t, err)
			require.LessOrEqual(t, len(resp.ActionHistory), step)
			require.Subset(t, msgs, resp.ActionHistory)
		}
	})
	t.Run("ByKey", func(t *testing.T) {
		step := 2
		var next []byte
		for i := 0; i < len(msgs); i += step {
			resp, err := qs.ListActionHistory(f.ctx, request(next, 0, uint64(step), false))
			require.NoError(t, err)
			require.LessOrEqual(t, len(resp.ActionHistory), step)
			require.Subset(t, msgs, resp.ActionHistory)
			next = resp.Pagination.NextKey
		}
	})
	t.Run("Total", func(t *testing.T) {
		resp, err := qs.ListActionHistory(f.ctx, request(nil, 0, 0, true))
		require.NoError(t, err)
		require.Equal(t, len(msgs), int(resp.Pagination.Total))
		require.EqualExportedValues(t, msgs, resp.ActionHistory)
	})
	t.Run("InvalidRequest", func(t *testing.T) {
		_, err := qs.ListActionHistory(f.ctx, nil)
		require.ErrorIs(t, err, status.Error(codes.InvalidArgument, "invalid request"))
	})
}
