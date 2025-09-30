package types

func NewMsgPostSmallBlind(creator string, gameId uint64) *MsgPostSmallBlind {
	return &MsgPostSmallBlind{
		Creator: creator,
		GameId:  gameId,
	}
}
