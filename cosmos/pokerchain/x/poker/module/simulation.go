package poker

import (
	"math/rand"

	"github.com/cosmos/cosmos-sdk/types/module"
	simtypes "github.com/cosmos/cosmos-sdk/types/simulation"
	"github.com/cosmos/cosmos-sdk/x/simulation"

	pokersimulation "github.com/yourusername/pokerchain/x/poker/simulation"
	"github.com/yourusername/pokerchain/x/poker/types"
)

// GenerateGenesisState creates a randomized GenState of the module.
func (AppModule) GenerateGenesisState(simState *module.SimulationState) {
	accs := make([]string, len(simState.Accounts))
	for i, acc := range simState.Accounts {
		accs[i] = acc.Address.String()
	}
	pokerGenesis := types.GenesisState{
		Params: types.DefaultParams(),
	}
	simState.GenState[types.ModuleName] = simState.Cdc.MustMarshalJSON(&pokerGenesis)
}

// RegisterStoreDecoder registers a decoder.
func (am AppModule) RegisterStoreDecoder(_ simtypes.StoreDecoderRegistry) {}

// WeightedOperations returns the all the gov module operations with their respective weights.
func (am AppModule) WeightedOperations(simState module.SimulationState) []simtypes.WeightedOperation {
	operations := make([]simtypes.WeightedOperation, 0)
	const (
		opWeightMsgCreateGame          = "op_weight_msg_poker"
		defaultWeightMsgCreateGame int = 100
	)

	var weightMsgCreateGame int
	simState.AppParams.GetOrGenerate(opWeightMsgCreateGame, &weightMsgCreateGame, nil,
		func(_ *rand.Rand) {
			weightMsgCreateGame = defaultWeightMsgCreateGame
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgCreateGame,
		pokersimulation.SimulateMsgCreateGame(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgJoinGame          = "op_weight_msg_poker"
		defaultWeightMsgJoinGame int = 100
	)

	var weightMsgJoinGame int
	simState.AppParams.GetOrGenerate(opWeightMsgJoinGame, &weightMsgJoinGame, nil,
		func(_ *rand.Rand) {
			weightMsgJoinGame = defaultWeightMsgJoinGame
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgJoinGame,
		pokersimulation.SimulateMsgJoinGame(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgLeaveGame          = "op_weight_msg_poker"
		defaultWeightMsgLeaveGame int = 100
	)

	var weightMsgLeaveGame int
	simState.AppParams.GetOrGenerate(opWeightMsgLeaveGame, &weightMsgLeaveGame, nil,
		func(_ *rand.Rand) {
			weightMsgLeaveGame = defaultWeightMsgLeaveGame
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgLeaveGame,
		pokersimulation.SimulateMsgLeaveGame(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgDealCards          = "op_weight_msg_poker"
		defaultWeightMsgDealCards int = 100
	)

	var weightMsgDealCards int
	simState.AppParams.GetOrGenerate(opWeightMsgDealCards, &weightMsgDealCards, nil,
		func(_ *rand.Rand) {
			weightMsgDealCards = defaultWeightMsgDealCards
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgDealCards,
		pokersimulation.SimulateMsgDealCards(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgPostSmallBlind          = "op_weight_msg_poker"
		defaultWeightMsgPostSmallBlind int = 100
	)

	var weightMsgPostSmallBlind int
	simState.AppParams.GetOrGenerate(opWeightMsgPostSmallBlind, &weightMsgPostSmallBlind, nil,
		func(_ *rand.Rand) {
			weightMsgPostSmallBlind = defaultWeightMsgPostSmallBlind
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgPostSmallBlind,
		pokersimulation.SimulateMsgPostSmallBlind(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgPostBigBlind          = "op_weight_msg_poker"
		defaultWeightMsgPostBigBlind int = 100
	)

	var weightMsgPostBigBlind int
	simState.AppParams.GetOrGenerate(opWeightMsgPostBigBlind, &weightMsgPostBigBlind, nil,
		func(_ *rand.Rand) {
			weightMsgPostBigBlind = defaultWeightMsgPostBigBlind
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgPostBigBlind,
		pokersimulation.SimulateMsgPostBigBlind(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgFold          = "op_weight_msg_poker"
		defaultWeightMsgFold int = 100
	)

	var weightMsgFold int
	simState.AppParams.GetOrGenerate(opWeightMsgFold, &weightMsgFold, nil,
		func(_ *rand.Rand) {
			weightMsgFold = defaultWeightMsgFold
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgFold,
		pokersimulation.SimulateMsgFold(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgCheck          = "op_weight_msg_poker"
		defaultWeightMsgCheck int = 100
	)

	var weightMsgCheck int
	simState.AppParams.GetOrGenerate(opWeightMsgCheck, &weightMsgCheck, nil,
		func(_ *rand.Rand) {
			weightMsgCheck = defaultWeightMsgCheck
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgCheck,
		pokersimulation.SimulateMsgCheck(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgBet          = "op_weight_msg_poker"
		defaultWeightMsgBet int = 100
	)

	var weightMsgBet int
	simState.AppParams.GetOrGenerate(opWeightMsgBet, &weightMsgBet, nil,
		func(_ *rand.Rand) {
			weightMsgBet = defaultWeightMsgBet
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgBet,
		pokersimulation.SimulateMsgBet(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgCall          = "op_weight_msg_poker"
		defaultWeightMsgCall int = 100
	)

	var weightMsgCall int
	simState.AppParams.GetOrGenerate(opWeightMsgCall, &weightMsgCall, nil,
		func(_ *rand.Rand) {
			weightMsgCall = defaultWeightMsgCall
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgCall,
		pokersimulation.SimulateMsgCall(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgRaise          = "op_weight_msg_poker"
		defaultWeightMsgRaise int = 100
	)

	var weightMsgRaise int
	simState.AppParams.GetOrGenerate(opWeightMsgRaise, &weightMsgRaise, nil,
		func(_ *rand.Rand) {
			weightMsgRaise = defaultWeightMsgRaise
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgRaise,
		pokersimulation.SimulateMsgRaise(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgShowCards          = "op_weight_msg_poker"
		defaultWeightMsgShowCards int = 100
	)

	var weightMsgShowCards int
	simState.AppParams.GetOrGenerate(opWeightMsgShowCards, &weightMsgShowCards, nil,
		func(_ *rand.Rand) {
			weightMsgShowCards = defaultWeightMsgShowCards
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgShowCards,
		pokersimulation.SimulateMsgShowCards(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))
	const (
		opWeightMsgMuckCards          = "op_weight_msg_poker"
		defaultWeightMsgMuckCards int = 100
	)

	var weightMsgMuckCards int
	simState.AppParams.GetOrGenerate(opWeightMsgMuckCards, &weightMsgMuckCards, nil,
		func(_ *rand.Rand) {
			weightMsgMuckCards = defaultWeightMsgMuckCards
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgMuckCards,
		pokersimulation.SimulateMsgMuckCards(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))

	return operations
}

// ProposalMsgs returns msgs used for governance proposals for simulations.
func (am AppModule) ProposalMsgs(simState module.SimulationState) []simtypes.WeightedProposalMsg {
	return []simtypes.WeightedProposalMsg{}
}
