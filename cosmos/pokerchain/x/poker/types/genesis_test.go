package types_test

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/yourusername/pokerchain/x/poker/types"
)

func TestGenesisState_Validate(t *testing.T) {
	tests := []struct {
		desc     string
		genState *types.GenesisState
		valid    bool
	}{
		{
			desc:     "default is valid",
			genState: types.DefaultGenesis(),
			valid:    true,
		},
		{
			desc:     "valid genesis state",
			genState: &types.GenesisState{PlayerStateMap: []types.PlayerState{{Index: "0"}, {Index: "1"}}, ActionHistoryMap: []types.ActionHistory{{Index: "0"}, {Index: "1"}}},
			valid:    true,
		}, {
			desc: "duplicated playerState",
			genState: &types.GenesisState{
				PlayerStateMap: []types.PlayerState{
					{
						Index: "0",
					},
					{
						Index: "0",
					},
				},
				ActionHistoryMap: []types.ActionHistory{{Index: "0"}, {Index: "1"}}},
			valid: false,
		}, {
			desc: "duplicated actionHistory",
			genState: &types.GenesisState{
				ActionHistoryMap: []types.ActionHistory{
					{
						Index: "0",
					},
					{
						Index: "0",
					},
				},
			},
			valid: false,
		},
	}
	for _, tc := range tests {
		t.Run(tc.desc, func(t *testing.T) {
			err := tc.genState.Validate()
			if tc.valid {
				require.NoError(t, err)
			} else {
				require.Error(t, err)
			}
		})
	}
}
