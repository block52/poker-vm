package keeper_test

import (
	"testing"

	"github.com/yourusername/pokerchain/x/poker/types"

	"github.com/stretchr/testify/require"
)

func TestGenesis(t *testing.T) {
	genesisState := types.GenesisState{
		Params:         types.DefaultParams(),
		PlayerStateMap: []types.PlayerState{{Index: "0"}, {Index: "1"}}, ActionHistoryMap: []types.ActionHistory{{Index: "0"}, {Index: "1"}}}

	f := initFixture(t)
	err := f.keeper.InitGenesis(f.ctx, genesisState)
	require.NoError(t, err)
	got, err := f.keeper.ExportGenesis(f.ctx)
	require.NoError(t, err)
	require.NotNil(t, got)

	require.EqualExportedValues(t, genesisState.Params, got.Params)
	require.EqualExportedValues(t, genesisState.PlayerStateMap, got.PlayerStateMap)
	require.EqualExportedValues(t, genesisState.ActionHistoryMap, got.ActionHistoryMap)

}
