package poker

import (
	autocliv1 "cosmossdk.io/api/cosmos/autocli/v1"

	"github.com/yourusername/pokerchain/x/poker/types"
)

// AutoCLIOptions implements the autocli.HasAutoCLIConfig interface.
func (am AppModule) AutoCLIOptions() *autocliv1.ModuleOptions {
	return &autocliv1.ModuleOptions{
		Query: &autocliv1.ServiceCommandDescriptor{
			Service: types.Query_serviceDesc.ServiceName,
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "Params",
					Use:       "params",
					Short:     "Shows the parameters of the module",
				},
				{
					RpcMethod:      "Game",
					Use:            "game [game-id]",
					Short:          "Query game",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}},
				},

				{
					RpcMethod:      "ListGames",
					Use:            "list-games ",
					Short:          "Query list-games",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{},
				},

				{
					RpcMethod:      "PlayerGames",
					Use:            "player-games [player-address]",
					Short:          "Query player-games",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "player_address"}},
				},

				{
					RpcMethod:      "LegalActions",
					Use:            "legal-actions [game-id] [player-address]",
					Short:          "Query legal-actions",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}, {ProtoField: "player_address"}},
				},

				{
					RpcMethod: "ListPlayerState",
					Use:       "list-player-state",
					Short:     "List all player-state",
				},
				{
					RpcMethod:      "GetPlayerState",
					Use:            "get-player-state [id]",
					Short:          "Gets a player-state",
					Alias:          []string{"show-player-state"},
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "index"}},
				},
				{
					RpcMethod: "ListActionHistory",
					Use:       "list-action-history",
					Short:     "List all action-history",
				},
				{
					RpcMethod:      "GetActionHistory",
					Use:            "get-action-history [id]",
					Short:          "Gets a action-history",
					Alias:          []string{"show-action-history"},
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "index"}},
				},
				// this line is used by ignite scaffolding # autocli/query
			},
		},
		Tx: &autocliv1.ServiceCommandDescriptor{
			Service:              types.Msg_serviceDesc.ServiceName,
			EnhanceCustomCommand: true, // only required if you want to use the custom command
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "UpdateParams",
					Skip:      true, // skipped because authority gated
				},
				{
					RpcMethod:      "CreateGame",
					Use:            "create-game [min-buy-in] [max-buy-in] [small-blind] [big-blind] [max-players] [min-players]",
					Short:          "Send a create-game tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "min_buy_in"}, {ProtoField: "max_buy_in"}, {ProtoField: "small_blind"}, {ProtoField: "big_blind"}, {ProtoField: "max_players"}, {ProtoField: "min_players"}},
				},
				{
					RpcMethod:      "JoinGame",
					Use:            "join-game [game-id] [seat] [buy-in]",
					Short:          "Send a join-game tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}, {ProtoField: "seat"}, {ProtoField: "buy_in"}},
				},
				{
					RpcMethod:      "LeaveGame",
					Use:            "leave-game [game-id]",
					Short:          "Send a leave-game tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}},
				},
				{
					RpcMethod:      "DealCards",
					Use:            "deal-cards [game-id]",
					Short:          "Send a deal-cards tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}},
				},
				{
					RpcMethod:      "PostSmallBlind",
					Use:            "post-small-blind [game-id]",
					Short:          "Send a post-small-blind tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}},
				},
				{
					RpcMethod:      "PostBigBlind",
					Use:            "post-big-blind [game-id]",
					Short:          "Send a post-big-blind tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}},
				},
				{
					RpcMethod:      "Fold",
					Use:            "fold [game-id]",
					Short:          "Send a fold tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}},
				},
				{
					RpcMethod:      "Check",
					Use:            "check [game-id]",
					Short:          "Send a check tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}},
				},
				{
					RpcMethod:      "Bet",
					Use:            "bet [game-id] [amount]",
					Short:          "Send a bet tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}, {ProtoField: "amount"}},
				},
				{
					RpcMethod:      "Call",
					Use:            "call [game-id]",
					Short:          "Send a call tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}},
				},
				{
					RpcMethod:      "Raise",
					Use:            "raise [game-id] [amount]",
					Short:          "Send a raise tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}, {ProtoField: "amount"}},
				},
				{
					RpcMethod:      "ShowCards",
					Use:            "show-cards [game-id]",
					Short:          "Send a show-cards tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}},
				},
				{
					RpcMethod:      "MuckCards",
					Use:            "muck-cards [game-id]",
					Short:          "Send a muck-cards tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "game_id"}},
				},
				// this line is used by ignite scaffolding # autocli/tx
			},
		},
	}
}
