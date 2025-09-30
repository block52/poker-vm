package types

func NewMsgCreateGame(creator string, minBuyIn uint64, maxBuyIn uint64, smallBlind uint64, bigBlind uint64, maxPlayers uint64, minPlayers uint64) *MsgCreateGame {
	return &MsgCreateGame{
		Creator:    creator,
		MinBuyIn:   minBuyIn,
		MaxBuyIn:   maxBuyIn,
		SmallBlind: smallBlind,
		BigBlind:   bigBlind,
		MaxPlayers: maxPlayers,
		MinPlayers: minPlayers,
	}
}
