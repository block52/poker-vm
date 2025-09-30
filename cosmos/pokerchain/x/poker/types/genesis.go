package types

import "fmt"

// DefaultGenesis returns the default genesis state
func DefaultGenesis() *GenesisState {
	return &GenesisState{
		Params:         DefaultParams(),
		PlayerStateMap: []PlayerState{}, ActionHistoryMap: []ActionHistory{}}
}

// Validate performs basic genesis state validation returning an error upon any
// failure.
func (gs GenesisState) Validate() error {
	playerStateIndexMap := make(map[string]struct{})

	for _, elem := range gs.PlayerStateMap {
		index := fmt.Sprint(elem.Index)
		if _, ok := playerStateIndexMap[index]; ok {
			return fmt.Errorf("duplicated index for playerState")
		}
		playerStateIndexMap[index] = struct{}{}
	}
	actionHistoryIndexMap := make(map[string]struct{})

	for _, elem := range gs.ActionHistoryMap {
		index := fmt.Sprint(elem.Index)
		if _, ok := actionHistoryIndexMap[index]; ok {
			return fmt.Errorf("duplicated index for actionHistory")
		}
		actionHistoryIndexMap[index] = struct{}{}
	}

	return gs.Params.Validate()
}
