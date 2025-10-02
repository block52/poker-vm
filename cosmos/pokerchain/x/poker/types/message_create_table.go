package types

import (
	errorsmod "cosmossdk.io/errors"
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

var _ sdk.Msg = &MsgCreateTable{}

func NewMsgCreateTable(
	creator string,
	tableAddress string,
	buyIn uint64,
	tableType TableType,
	smallBlind uint64,
	bigBlind uint64,
	maxPlayers uint32,
	minPlayers uint32,
) *MsgCreateTable {
	return &MsgCreateTable{
		Creator:      creator,
		TableAddress: tableAddress,
		BuyIn:        buyIn,
		TableType:    tableType,
		SmallBlind:   smallBlind,
		BigBlind:     bigBlind,
		MaxPlayers:   maxPlayers,
		MinPlayers:   minPlayers,
	}
}

func (msg *MsgCreateTable) ValidateBasic() error {
	_, err := sdk.AccAddressFromBech32(msg.Creator)
	if err != nil {
		return errorsmod.Wrapf(sdkerrors.ErrInvalidAddress, "invalid creator address (%s)", err)
	}

	if msg.TableAddress == "" {
		return errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "table address cannot be empty")
	}

	if msg.BuyIn == 0 {
		return errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "buy-in must be greater than 0")
	}

	if msg.SmallBlind == 0 {
		return errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "small blind must be greater than 0")
	}

	if msg.BigBlind == 0 {
		return errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "big blind must be greater than 0")
	}

	if msg.BigBlind <= msg.SmallBlind {
		return errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "big blind must be greater than small blind")
	}

	if msg.MaxPlayers < 2 {
		return errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "max players must be at least 2")
	}

	if msg.MinPlayers < 2 {
		return errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "min players must be at least 2")
	}

	if msg.MinPlayers > msg.MaxPlayers {
		return errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "min players cannot be greater than max players")
	}

	return nil
}