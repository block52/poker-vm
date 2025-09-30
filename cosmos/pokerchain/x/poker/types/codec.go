package types

import (
	codectypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/msgservice"
)

func RegisterInterfaces(registrar codectypes.InterfaceRegistry) {
	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgMuckCards{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgShowCards{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgRaise{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgCall{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgBet{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgCheck{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgFold{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgPostBigBlind{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgPostSmallBlind{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgDealCards{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgLeaveGame{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgJoinGame{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgCreateGame{},
	)

	registrar.RegisterImplementations((*sdk.Msg)(nil),
		&MsgUpdateParams{},
	)
	msgservice.RegisterMsgServiceDesc(registrar, &_Msg_serviceDesc)
}
